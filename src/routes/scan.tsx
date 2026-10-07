import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScanResultCard, type ScanView } from "@/components/ScanResultCard";
import { analyzePlant } from "@/lib/ai.functions";
import { fileToDownscaledDataUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan a plant leaf for disease — KisanSahayak" },
      {
        name: "description",
        content:
          "Take a photo of a leaf or upload one and get the plant disease, severity and simple treatment steps in your own language.",
      },
      { property: "og:title", content: "Scan a plant leaf for disease — KisanSahayak" },
      {
        property: "og:description",
        content: "Camera scan or photo upload for instant plant disease detection and treatment advice.",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const analyze = useServerFn(analyzePlant);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanView | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!user) {
      toast.error(t("loginNeeded"));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const imageDataUrl = await fileToDownscaledDataUrl(file);
      const res = await analyze({ data: { imageDataUrl, language: lang } });
      const view: ScanView = {
        imageUrl: imageDataUrl,
        crop: res.crop,
        disease: res.disease,
        severityLabel: res.severityLabel,
        severityScore: res.severityScore,
        summary: res.summary,
        steps: res.steps,
        when: new Date().toLocaleString(),
      };
      setResult(view);

      if (user) {
        const { error } = await supabase.from("scans").insert({
          user_id: user.id,
          crop: res.crop || null,
          disease: res.disease,
          severity_label: res.severityLabel,
          severity_score: Math.round(res.severityScore),
          summary: res.summary,
          steps: res.steps,
          language: lang,
        });
        if (error) {
          toast.error("The scan was analysed but could not be saved. Please try again.");
        } else {
          toast.success(t("saved"));
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <section className="mb-7">
        <div className="rounded-3xl bg-leaf p-5 ring-1 ring-leaf-700">
          <h1 className="font-display text-2xl font-semibold text-cream">{t("scanTitle")}</h1>
          <p className="mt-1 text-sm font-medium text-cream/80">{t("scanSubtitle")}</p>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              void handleFile(file);
            }}
          />
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-sun py-5 text-lg font-semibold text-soil ring-1 ring-sun-700 disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
            {busy ? t("analysing") : t("scanPlant")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-cream ring-1 ring-cream/40 disabled:opacity-70"
          >
            <ImagePlus className="size-5" />
            {t("uploadPhoto")}
          </button>
        </div>
      </section>

      {!user ? (
        <Link
          to="/auth"
          className="mb-7 flex items-center justify-between gap-3 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5"
        >
          <span className="min-w-0 text-[15px] font-medium text-soil-700">{t("loginNeeded")}</span>
          <span className="shrink-0 rounded-full bg-leaf px-3 py-1.5 text-sm font-bold text-cream">
            {t("signIn")}
          </span>
        </Link>
      ) : null}

      {result ? (
        <section className="mb-7 space-y-3">
          <ScanResultCard scan={result} />
          <button
            type="button"
            onClick={() => setResult(null)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cream-2 py-4 text-base font-semibold text-soil-700 ring-1 ring-black/5"
          >
            <RefreshCw className="size-5" />
            {t("retake")}
          </button>
        </section>
      ) : null}
    </AppShell>
  );
}

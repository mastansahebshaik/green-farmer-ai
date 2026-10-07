import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getYieldTips, speakText } from "@/lib/ai.functions";
import { playBase64Mp3 } from "@/lib/media";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Crop yield tips for your farm — KisanSahayak" },
      {
        name: "description",
        content: "Get simple, low-cost steps to raise the yield of your crop, written in your own language.",
      },
      { property: "og:title", content: "Crop yield tips for your farm — KisanSahayak" },
      { property: "og:description", content: "Practical, low-cost ways to grow more from the same field." },
    ],
  }),
  component: TipsPage,
});

function TipsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const fetchTips = useServerFn(getYieldTips);
  const speak = useServerFn(speakText);
  const [crop, setCrop] = useState("");
  const [busy, setBusy] = useState(false);
  const [tips, setTips] = useState<{ title: string; detail: string }[]>([]);

  const load = async () => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    setBusy(true);
    try {
      const res = await fetchTips({ data: { language: lang, crop: crop || undefined } });
      setTips(res.tips);
      if (res.tips.length === 0) toast.error("No tips came back. Please try again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load tips");
    } finally {
      setBusy(false);
    }
  };

  const readAloud = async () => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    try {
      const text = tips.map((tip) => `${tip.title}. ${tip.detail}`).join(". ");
      const { audioBase64 } = await speak({ data: { text, language: lang } });
      await playBase64Mp3(audioBase64);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice failed");
    }
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("yieldTitle")}</h1>
      <p className="mt-1 text-[15px] font-medium text-soil-500">{t("growMore")}</p>

      <div className="mt-5 rounded-3xl bg-cream-2 p-4 ring-1 ring-black/5">
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="Wheat, cotton, tomato…"
          className="w-full rounded-2xl bg-cream px-4 py-4 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf"
        />
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf py-4 text-lg font-semibold text-cream ring-1 ring-leaf-700 disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Sprout className="size-5" />}
          {t("growMore")}
        </button>
      </div>

      {tips.length > 0 ? (
        <div className="mt-6 space-y-2.5">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sun font-display text-base font-bold text-soil">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold text-soil">{tip.title}</span>
                <span className="block text-[15px] font-medium leading-snug text-soil-700">{tip.detail}</span>
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={readAloud}
            className="w-full rounded-2xl py-4 text-base font-semibold text-leaf-700 ring-1 ring-leaf/30"
          >
            {t("speakAnswer")}
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

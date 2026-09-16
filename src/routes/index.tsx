import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, ChevronRight, Leaf, MessageCircle, Mic, Sprout, Store } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KisanSahayak — Plant disease scanner and farm advice" },
      {
        name: "description",
        content:
          "Scan plant leaves for disease, get simple treatment steps, crop yield tips and a voice assistant in Hindi, Marathi, Bengali, Telugu, Tamil, Kannada and English.",
      },
      { property: "og:title", content: "KisanSahayak — Plant disease scanner and farm advice" },
      {
        property: "og:description",
        content: "Farming help in your own language: leaf scans, treatment steps, yield tips and a talking assistant.",
      },
    ],
  }),
  component: HomePage,
});

const QUICK_TIPS = [
  { key: "soil", title: "Test your soil", detail: "Add only the nutrients the soil is missing." },
  { key: "water", title: "Water early morning", detail: "Less water is lost to the sun." },
  { key: "space", title: "Keep row spacing", detail: "Air flow keeps fungus away." },
];

function HomePage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: scans } = useQuery({
    queryKey: ["scans", user?.id, "recent"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, disease, crop, severity_label, severity_score, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const name = (user?.user_metadata?.["full_name"] as string | undefined) ?? "";

  return (
    <AppShell>
      <section className="mb-7">
        <h1 className="font-display text-3xl font-semibold leading-tight text-soil">
          {t("greeting")}
          {name ? `, ${name.split(" ")[0]}` : ""} 🌾
        </h1>
        <p className="mt-1 text-[15px] font-medium text-soil-500">{t("scanSubtitle")}</p>
      </section>

      <Link
        to="/scan"
        className="mb-7 flex items-center gap-4 rounded-3xl bg-sun p-5 ring-1 ring-sun-700"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-soil">
          <Camera className="size-7 text-cream" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold text-soil">{t("scanPlant")}</span>
          <span className="block truncate text-sm font-medium text-soil-700">{t("scanTitle")}</span>
        </span>
      </Link>

      <section className="mb-7">
        <h2 className="mb-3 font-display text-2xl font-semibold text-soil">{t("growMore")}</h2>
        <div className="space-y-2.5">
          {QUICK_TIPS.map((tip) => (
            <div key={tip.key} className="flex items-start gap-3 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf/15">
                <Leaf className="size-5 text-leaf-700" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold text-soil">{tip.title}</span>
                <span className="block text-sm font-medium text-soil-500">{tip.detail}</span>
              </span>
            </div>
          ))}
        </div>
        <Link
          to="/tips"
          className="mt-3 flex items-center justify-center gap-1 rounded-2xl py-3.5 text-base font-semibold text-leaf-700 ring-1 ring-leaf/30"
        >
          {t("yieldTitle")}
          <ChevronRight className="size-5" />
        </Link>
      </section>

      <Link to="/chat" className="mb-3 flex items-center gap-4 rounded-3xl bg-cream-2 p-5 ring-1 ring-black/5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf/15">
          <MessageCircle className="size-7 text-leaf-700" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold text-soil">{t("chatTitle")}</span>
          <span className="block text-sm font-medium text-soil-500">{t("chatSubtitle")}</span>
        </span>
      </Link>

      <Link to="/fertilizers" className="mb-3 flex items-center gap-4 rounded-3xl bg-cream-2 p-5 ring-1 ring-black/5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun/30">
          <Sprout className="size-7 text-sun-700" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold text-soil">{t("fertTitle")}</span>
          <span className="block text-sm font-medium text-soil-500">{t("fertSubtitle")}</span>
        </span>
      </Link>

      <Link to="/shops" className="mb-3 flex items-center gap-4 rounded-3xl bg-cream-2 p-5 ring-1 ring-black/5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-clay/15">
          <Store className="size-7 text-clay" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold text-soil">{t("shopsTitle")}</span>
          <span className="block text-sm font-medium text-soil-500">{t("shopsSubtitle")}</span>
        </span>
      </Link>

      <Link to="/voice" className="mb-7 flex items-center gap-4 rounded-3xl bg-leaf p-5 ring-1 ring-leaf-700">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-cream">
          <Mic className="size-7 text-leaf-700" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold text-cream">{t("askByVoice")}</span>
          <span className="block text-sm font-medium text-cream/80">{t("voiceSubtitle")}</span>
        </span>
      </Link>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="min-w-0 font-display text-2xl font-semibold text-soil">{t("pastScans")}</h2>
          <Link to="/me" className="shrink-0 text-sm font-bold text-leaf-700">
            {t("seeAll")}
          </Link>
        </div>
        {!user ? (
          <Link to="/auth" className="block rounded-2xl bg-cream-2 p-4 text-[15px] font-medium text-soil-700 ring-1 ring-black/5">
            {t("loginNeeded")}
          </Link>
        ) : scans && scans.length > 0 ? (
          <ul className="space-y-2.5">
            {scans.map((scan) => (
              <li key={scan.id} className="flex items-center gap-3 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold text-soil">{scan.disease}</span>
                  <span className="block truncate text-sm font-medium text-soil-500">
                    {scan.crop ? `${scan.crop} · ` : ""}
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-sm font-bold text-soil-700 ring-1 ring-black/10">
                  {scan.severity_score}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-cream-2 p-4 text-[15px] font-medium text-soil-500 ring-1 ring-black/5">
            {t("noScans")}
          </p>
        )}
      </section>
    </AppShell>
  );
}

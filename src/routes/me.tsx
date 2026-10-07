import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin.functions";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My farm records — KisanSahayak" },
      {
        name: "description",
        content: "Your farmer profile, chosen language and every plant disease scan you have saved.",
      },
      { property: "og:title", content: "My farm records — KisanSahayak" },
      { property: "og:description", content: "Your profile and the history of every leaf you scanned." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { t, lang, setLang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [village, setVillage] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, error: profileError } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, village, language")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: scans, error: scansError } = useQuery({
    queryKey: ["scans", user?.id, "all"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, disease, crop, severity_label, severity_score, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const checkAdminFn = useServerFn(checkAdmin);
  const { data: adminCheck } = useQuery({
    queryKey: ["admin-check", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      try {
        return await checkAdminFn({ data: undefined });
      } catch {
        return { isAdmin: false };
      }
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setVillage(profile.village ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, village, language: lang })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("saved"));
      void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const field =
    "w-full rounded-2xl bg-cream px-4 py-4 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf";

  if (!loading && !user) {
    return (
      <AppShell>
        <h1 className="font-display text-3xl font-semibold text-soil">{t("profile")}</h1>
        <Link
          to="/auth"
          className="mt-5 block rounded-2xl bg-leaf py-4 text-center text-lg font-semibold text-cream ring-1 ring-leaf-700"
        >
          {t("signIn")}
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("profile")}</h1>

      <section className="mt-5 space-y-3 rounded-3xl bg-cream-2 p-4 ring-1 ring-black/5">
        <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("fullName")} />
        <input className={field} value={village} onChange={(e) => setVillage(e.target.value)} placeholder={t("village")} />
        <div className="grid grid-cols-4 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code as LangCode)}
              className={`rounded-xl py-2.5 font-display text-base font-semibold ${
                l.code === lang ? "bg-leaf text-cream" : "bg-cream text-soil ring-1 ring-black/10"
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-2xl bg-leaf py-4 text-lg font-semibold text-cream ring-1 ring-leaf-700 disabled:opacity-70"
        >
          {t("saveProfile")}
        </button>
      </section>

      {profileError || scansError ? (
        <p className="mt-5 rounded-2xl bg-cream-2 p-4 text-[15px] font-medium text-clay ring-1 ring-clay/20">
          Some account data could not be loaded. Please try again.
        </p>
      ) : null}

      <section className="mt-7">
        <h2 className="mb-3 font-display text-2xl font-semibold text-soil">{t("pastScans")}</h2>
        {scans && scans.length > 0 ? (
          <ul className="space-y-2.5">
            {scans.map((scan) => (
              <li key={scan.id} className="flex items-center gap-3 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold text-soil">{scan.disease}</span>
                  <span className="block truncate text-sm font-medium text-soil-500">
                    {scan.crop ? `${scan.crop} · ` : ""}
                    {new Date(scan.created_at).toLocaleDateString()} · {scan.severity_label}
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

      {adminCheck?.isAdmin && (
        <Link
          to="/admin"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-soil py-4 text-base font-semibold text-cream ring-1 ring-soil-800"
        >
          <Shield className="size-5" />
          {t("adminConsole")}
        </Link>
      )}

      <button
        type="button"
        onClick={signOut}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-clay ring-1 ring-clay/30"
      >
        <LogOut className="size-5" />
        {t("signOut")}
      </button>
    </AppShell>
  );
}

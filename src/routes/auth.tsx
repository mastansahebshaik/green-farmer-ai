import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Farmer sign in — KisanSahayak" },
      {
        name: "description",
        content: "Sign in or create a free farmer account to save your plant scans and crop records.",
      },
      { property: "og:title", content: "Farmer sign in — KisanSahayak" },
      { property: "og:description", content: "Create a free account to save your plant scans and crop records." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, language: lang },
          },
        });
        if (error) throw error;
        toast.success(t("checkEmail"));
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // One language choice per login: store it on the farmer's profile.
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ language: lang })
            .eq("id", data.user.id);
          if (profileError) console.error("Could not save language preference:", profileError);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("profiles").update({ language: lang }).eq("id", data.user.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-2xl bg-cream-2 px-4 py-4 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf";

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf font-display text-2xl font-bold text-cream">
            K
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold text-soil">{t("appName")}</h1>
            <p className="truncate text-sm font-medium text-soil-500">{t("tagline")}</p>
          </div>
        </div>

        <section className="mb-5">
          <h2 className="mb-3 font-display text-xl font-semibold text-soil">{t("chooseLanguage")}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code as LangCode)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-3 ${
                    active ? "bg-leaf text-cream ring-2 ring-leaf-700" : "bg-cream-2 ring-1 ring-black/5"
                  }`}
                >
                  <span className={`font-display text-lg ${active ? "font-bold" : "font-semibold text-soil"}`}>
                    {l.short}
                  </span>
                  <span className={`text-[13px] ${active ? "font-semibold" : "font-medium text-soil-500"}`}>
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-cream-2 p-1.5 ring-1 ring-black/5">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-3 text-base font-semibold ${
                mode === m ? "bg-leaf text-cream" : "text-soil-700"
              }`}
            >
              {m === "in" ? t("signIn") : t("signUp")}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "up" ? (
            <input
              className={field}
              placeholder={t("fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          ) : null}
          <input
            className={field}
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={field}
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf py-4 text-lg font-semibold text-cream ring-1 ring-leaf-700 disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : null}
            {mode === "in" ? t("signIn") : t("signUp")}
          </button>
        </form>

        <button
          type="button"
          onClick={google}
          className="mt-3 w-full rounded-2xl bg-cream-2 py-4 text-base font-semibold text-soil ring-1 ring-black/10"
        >
          {t("continueGoogle")}
        </button>
      </div>
    </div>
  );
}

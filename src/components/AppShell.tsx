import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Home, MessageCircle, Store, User, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();

  // The farmer picks a language once at sign in; every later visit follows the saved choice.
  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const saved = data?.language as LangCode | undefined;
        if (active && saved && saved !== window.localStorage.getItem("ks-lang")) setLang(saved);
      });
    return () => {
      active = false;
    };
  }, [user, setLang]);

  const initial = (user?.user_metadata?.["full_name"] as string | undefined)?.[0]?.toUpperCase() ?? "?";

  const nav = [
    { to: "/", label: t("home"), Icon: Home },
    { to: "/scan", label: t("scan"), Icon: Camera },
    { to: "/chat", label: t("chat"), Icon: MessageCircle },
    { to: "/shops", label: t("shops"), Icon: Store },
    { to: "/me", label: t("me"), Icon: User },
  ] as const;

  async function changeLanguage(code: LangCode) {
    setLang(code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("id", user.id);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-body text-soil antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-soil focus:px-4 focus:py-2 focus:text-cream"
      >
        {t("home")}
      </a>

      <header className="sticky top-0 z-20 bg-cream/95 pt-[env(safe-area-inset-top)] ring-1 ring-black/5 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf font-display text-lg font-bold text-cream">
              K
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-lg font-semibold text-soil">
                {t("appName")}
              </span>
              <span className="block truncate text-[11px] font-medium text-soil-500">{t("tagline")}</span>
            </span>
          </Link>

          <label className="relative grid h-11 place-items-center rounded-2xl bg-cream-2 px-3 ring-1 ring-black/5">
            <span className="sr-only">{t("language")}</span>
            <span aria-hidden className="font-display text-base font-bold text-soil">
              {LANGUAGES.find((l) => l.code === lang)?.short ?? "EN"}
            </span>
            <select
              aria-label={t("language")}
              value={lang}
              onChange={(e) => void changeLanguage(e.target.value as LangCode)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <Link
            to="/me"
            aria-label={t("profile")}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-2 ring-1 ring-black/5"
          >
            <span className="grid size-9 place-items-center rounded-full bg-clay font-display text-base font-bold text-cream">
              {initial}
            </span>
          </Link>
        </div>

        {!online && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-clay px-4 py-2 text-[13px] font-semibold text-cream"
          >
            <WifiOff className="size-4" />
            {t("offline")}
          </div>
        )}
      </header>

      <main id="main" className="mx-auto max-w-md px-4 pb-32 pt-5">
        {children}
      </main>

      <nav
        aria-label={t("appName")}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {nav.map(({ to, label, Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? "text-leaf-700" : "text-soil-500"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-xs ${active ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

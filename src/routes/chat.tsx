import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Sprout } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { askAssistant } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Farm chat helper — KisanSahayak" },
      {
        name: "description",
        content:
          "Chat with a friendly farming helper about your plant: next steps after a disease scan, fertiliser, watering and spraying advice in your language.",
      },
      { property: "og:title", content: "Farm chat helper — KisanSahayak" },
      {
        property: "og:description",
        content: "Step-by-step plant care guidance in a simple chat, in your own language.",
      },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const { data: lastScan } = useQuery({
    queryKey: ["scans", user?.id, "last"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("crop, disease, severity_label, summary")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (question: string) => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    const q = question.trim();
    if (!q || thinking) return;
    setText("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setThinking(true);
    try {
      const context = lastScan
        ? `The farmer's last leaf scan found: crop ${lastScan.crop || "unknown"}, problem ${lastScan.disease}, severity ${lastScan.severity_label}. ${lastScan.summary ?? ""}`
        : "";
      const { answer } = await ask({
        data: {
          language: lang,
          ...(context ? { context } : {}),
          messages: next,
        },
      });
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The helper could not answer");
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [t("chatQ1"), t("chatQ2"), t("chatQ3"), t("chatQ4")];

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("chatTitle")}</h1>
      <p className="mt-1 text-[15px] font-medium text-soil-500">{t("chatSubtitle")}</p>

      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf">
            <Sprout className="size-5 text-cream" />
          </span>
          <p className="max-w-[85%] rounded-3xl rounded-tl-md bg-cream-2 px-4 py-3 text-[15px] font-medium text-soil ring-1 ring-black/5">
            {t("chatIntro")}
          </p>
        </div>

        {lastScan ? (
          <p className="rounded-2xl bg-sun/25 px-4 py-3 text-sm font-semibold text-soil ring-1 ring-sun-700/30">
            {lastScan.crop ? `${lastScan.crop} · ` : ""}
            {lastScan.disease}
          </p>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}>
            {m.role === "assistant" ? (
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf">
                <Sprout className="size-5 text-cream" />
              </span>
            ) : null}
            <p
              className={`max-w-[85%] whitespace-pre-wrap px-4 py-3 text-[15px] font-medium ${
                m.role === "user"
                  ? "rounded-3xl rounded-br-md bg-leaf text-cream"
                  : "rounded-3xl rounded-tl-md bg-cream-2 text-soil ring-1 ring-black/5"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}

        {thinking ? (
          <div className="flex items-center gap-2 text-soil-500">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-[15px] font-medium">{t("analysing")}</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            className="rounded-full bg-cream-2 px-4 py-2.5 text-sm font-semibold text-soil-700 ring-1 ring-black/10"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
        className="fixed inset-x-0 bottom-[76px] z-10 mx-auto max-w-md px-4"
      >
        <div className="flex items-center gap-2 rounded-3xl bg-cream-2 p-2 ring-1 ring-black/10">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("typeQuestion")}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-medium text-soil outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !text.trim()}
            aria-label={t("send")}
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf text-cream disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </AppShell>
  );
}

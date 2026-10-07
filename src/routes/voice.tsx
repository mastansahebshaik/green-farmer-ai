import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Send, Square, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { askAssistant, speakText, transcribeAudio } from "@/lib/ai.functions";
import { blobToBase64, playBase64Mp3, startRecording, type Recorder } from "@/lib/media";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Talk to the farming assistant — KisanSahayak" },
      {
        name: "description",
        content: "Speak or type your farming question and hear the answer back in Hindi, Marathi, Tamil and more.",
      },
      { property: "og:title", content: "Talk to the farming assistant — KisanSahayak" },
      { property: "og:description", content: "A voice assistant that answers farm questions in your own language." },
    ],
  }),
  component: VoicePage,
});

type Msg = { role: "user" | "assistant"; content: string };

function VoicePage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const ask = useServerFn(askAssistant);
  const speak = useServerFn(speakText);
  const transcribe = useServerFn(transcribeAudio);

  const recorder = useRef<Recorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const sendQuestion = async (question: string, speakBack: boolean) => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setThinking(true);
    try {
      const { answer } = await ask({ data: { language: lang, messages: next } });
      setMessages([...next, { role: "assistant", content: answer }]);
      if (speakBack) {
        const { audioBase64 } = await speak({ data: { text: answer, language: lang } });
        await playBase64Mp3(audioBase64);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The assistant could not answer");
    } finally {
      setThinking(false);
    }
  };

  const toggleRecording = async () => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    if (recording) {
      setRecording(false);
      const rec = recorder.current;
      recorder.current = null;
      if (!rec) return;
      setThinking(true);
      try {
        const blob = await rec.stop();
        const audioBase64 = await blobToBase64(blob);
        const { text: heard } = await transcribe({ data: { audioBase64, language: lang } });
        if (!heard.trim()) {
          toast.error("Nothing was heard. Please try again.");
          return;
        }
        await sendQuestion(heard.trim(), true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Microphone failed");
      } finally {
        setThinking(false);
      }
      return;
    }

    try {
      recorder.current = await startRecording();
      setRecording(true);
    } catch {
      toast.error("Please allow microphone access to speak.");
    }
  };

  const replay = async (content: string) => {
    if (!user) { toast.error(t("loginNeeded")); return; }
    try {
      const { audioBase64 } = await speak({ data: { text: content, language: lang } });
      await playBase64Mp3(audioBase64);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice failed");
    }
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("askByVoice")}</h1>
      <p className="mt-1 text-[15px] font-medium text-soil-500">{t("voiceSubtitle")}</p>

      <div className="mt-6 flex flex-col items-center rounded-3xl bg-leaf p-6 ring-1 ring-leaf-700">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={thinking && !recording}
          aria-label={recording ? t("stop") : t("askByVoice")}
          className={`grid size-28 place-items-center rounded-full ring-8 disabled:opacity-70 ${
            recording ? "bg-clay ring-clay/30" : "bg-sun ring-sun/30"
          }`}
        >
          {thinking && !recording ? (
            <Loader2 className="size-12 animate-spin text-soil" />
          ) : recording ? (
            <Square className="size-11 text-cream" />
          ) : (
            <Mic className="size-12 text-soil" />
          )}
        </button>
        <p className="mt-4 text-center text-base font-semibold text-cream">
          {recording ? t("listening") : `${t("tapButton")} ${t("andSpeak")}`}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-3xl p-4 ring-1 ${
              msg.role === "user" ? "bg-cream-2 ring-black/5" : "bg-leaf/10 ring-leaf/25"
            }`}
          >
            <p className="text-[15px] font-medium leading-relaxed text-soil">{msg.content}</p>
            {msg.role === "assistant" ? (
              <button
                type="button"
                onClick={() => replay(msg.content)}
                className="mt-3 flex items-center gap-2 rounded-full bg-leaf px-4 py-2 text-sm font-bold text-cream"
              >
                <Volume2 className="size-4" />
                {t("speakAnswer")}
              </button>
            ) : null}
          </div>
        ))}
        {thinking ? (
          <div className="flex items-center gap-2 rounded-3xl bg-cream-2 p-4 text-[15px] font-medium text-soil-500 ring-1 ring-black/5">
            <Loader2 className="size-5 animate-spin" />
            {t("analysing")}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const question = text.trim();
          if (!question || thinking) return;
          setText("");
          void sendQuestion(question, false);
        }}
        className="fixed inset-x-0 bottom-[76px] z-10 mx-auto max-w-md bg-cream/95 px-4 py-3 backdrop-blur"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("typeQuestion")}
            className="min-w-0 rounded-2xl bg-cream-2 px-4 py-4 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf"
          />
          <button
            type="submit"
            disabled={thinking}
            aria-label={t("send")}
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf text-cream ring-1 ring-leaf-700 disabled:opacity-70"
          >
            <Send className="size-6" />
          </button>
        </div>
      </form>
    </AppShell>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  bn: "Bengali",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
};

const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;
const MAX_AUDIO_BASE64_LENGTH = 8_000_000;
const MAX_CHAT_MESSAGE_LENGTH = 2_000;
const AI_TIMEOUT_MS = 30_000;
const LanguageSchema = z.enum(["en", "hi", "mr", "bn", "te", "ta", "kn"]);

function stripJsonFence(content: string) {
  return content.replace(/^```(?:json)?\\s*/i, "").replace(/```\\s*$/, "").trim();
}
type RateLimitClient = import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>;

async function enforceAiRateLimit(supabase: RateLimitClient) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    _bucket: "ai",
    _limit: 20,
    _window_seconds: 60,
  });
  if (error) throw new Error("AI service is temporarily unavailable. Please try again.");
  if (!data) throw new Error("Too many AI requests. Please wait a minute and try again.");
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  catch (error) { if (error instanceof Error && error.name === "AbortError") throw new Error("The AI service took too long to respond. Please try again."); throw error; }
  finally { clearTimeout(timer); }
}

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");
  return key;
}

async function chat(body: Record<string, unknown>) {
  const res = await fetchWithTimeout(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[AI] chat request failed", res.status);
    if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
    if (res.status === 402) throw new Error("The AI credits for this app have run out.");
    throw new Error("AI request failed. Please try again.");
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

const AnalyzeInput = z.object({
  imageDataUrl: z.string().min(100).max(MAX_IMAGE_DATA_URL_LENGTH).regex(/^data:image\/(?:jpeg|png|webp);base64,/i, "Only JPEG, PNG, or WebP images are accepted."),
  language: LanguageSchema,
});

export type DiseaseResult = {
  crop: string;
  disease: string;
  healthy: boolean;
  severityLabel: string;
  severityScore: number;
  summary: string;
  steps: string[];
  prevention: string[];
};

const DiseaseResultSchema = z.object({
  crop: z.string().max(100).default(""),
  disease: z.string().min(1).max(200),
  healthy: z.boolean(),
  severityLabel: z.string().min(1).max(50),
  severityScore: z.coerce.number().finite().min(0).max(100),
  summary: z.string().max(1000).default(""),
  steps: z.array(z.string().min(1).max(400)).max(6).default([]),
  prevention: z.array(z.string().min(1).max(400)).max(6).default([]),
});

export const analyzePlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }): Promise<DiseaseResult> => {
    await enforceAiRateLimit(context.supabase);
    const language = LANGUAGE_NAMES[data.language] ?? "English";
    const content = await chat({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            `You are an experienced Indian agronomist helping a small farmer. Look at the plant photo and identify the crop and any disease or pest damage. ` +
            `Write everything in ${language}, in very simple words a farmer with little schooling understands. Give practical, low-cost, locally available treatments with clear quantities. ` +
            `Reply ONLY with JSON matching: {"crop":string,"disease":string,"healthy":boolean,"severityLabel":string,"severityScore":number,"summary":string,"steps":string[],"prevention":string[]}. ` +
            `severityScore is 0-100. steps has 3-4 short actions. prevention has 2-3 short tips. If the photo is not a plant, set disease to a short note saying so and healthy true.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Which disease is on this plant and what should I do?" },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      const parsed = JSON.parse(stripJsonFence(content)) as unknown;
      const checked = DiseaseResultSchema.safeParse(parsed);
      if (checked.success) return checked.data;
    } catch {
      // Fall through to a safe fallback response.
    }

    return {
      crop: "",
      disease: "Unknown",
      healthy: false,
      severityLabel: "unknown",
      severityScore: 0,
      summary: "The AI response could not be read safely. Please try another clear plant photo.",
      steps: [],
      prevention: [],
    };
  });

const AskInput = z
  .object({
    language: LanguageSchema,
    context: z.string().trim().max(1200).optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
        }),
      )
      .min(1)
      .max(20),
  })
  .superRefine((value, ctx) => {
    const total = value.messages.reduce((sum, message) => sum + message.content.length, 0);
    if (total > 20_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "Conversation is too long. Please start a new chat.",
      });
    }
  });

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    assertAiRateLimit(context.userId);
    const language = LANGUAGE_NAMES[data.language] ?? "English";
    const answer = await chat({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            `You are KisanSahayak, a friendly farming assistant for Indian farmers. Answer in ${language} only, in short simple sentences (max 6 sentences). ` +
            `Give practical advice on crop care, irrigation, fertiliser, pests, diseases, seed choice and getting a higher yield. Use local units (acre, litre, kg). ` +
            `When the farmer asks what to do next, answer as clear numbered steps with quantities and timing, and end with one short follow-up question. ` +
            `If a question is not about farming, gently bring it back to the farm.` +
            (data.context ? ` Background about this farmer: ${data.context}` : ""),
        },
        ...data.messages,
      ],
    });

    return { answer };
  });

const YieldInput = z.object({
  language: LanguageSchema,
  crop: z.string().trim().max(60).optional(),
});

const YieldTipsSchema = z.object({
  tips: z.array(z.object({
    title: z.string().min(1).max(80),
    detail: z.string().min(1).max(300),
  })).max(6),
});

export const getYieldTips = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => YieldInput.parse(input))
  .handler(async ({ data, context }) => {
    assertAiRateLimit(context.userId);
    const language = LANGUAGE_NAMES[data.language] ?? "English";
    const content = await chat({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            `You advise small Indian farmers on raising crop yield. Write in ${language}, very simple words. ` +
            `Reply ONLY with JSON: {"tips":[{"title":string,"detail":string}]} with exactly 6 tips. Title max 6 words, detail max 15 words.`,
        },
        {
          role: "user",
          content: data.crop
            ? `Give practical ways to get more yield from ${data.crop}.`
            : "Give practical ways to get more yield this season.",
        },
      ],
      response_format: { type: "json_object" },
    });
    try {
      const parsed = JSON.parse(stripJsonFence(content)) as {
        tips?: { title: string; detail: string }[];
      };
      return { tips: parsed.tips ?? [] };
    } catch {
      return { tips: [] };
    }
  });

const SpeakInput = z.object({
  text: z.string().trim().min(1).max(2000),
  language: LanguageSchema,
});

export const speakText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data, context }) => {
    assertAiRateLimit(context.userId);
    const language = LANGUAGE_NAMES[data.language] ?? "English";
    const res = await fetchWithTimeout(`${GATEWAY}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: "alloy",
        response_format: "mp3",
        instructions: `Speak in ${language} with a warm, calm, unhurried voice, as if talking to a farmer.`,
      }),
    });
    if (!res.ok) {
      const upstream = await res.text().catch(() => "");
      console.error("[AI] speech request failed", res.status);
      throw new Error("Voice generation failed. Please try again.");
    }
    const buffer = await res.arrayBuffer();
    return { audioBase64: Buffer.from(buffer).toString("base64") };
  });

const TranscribeInput = z.object({
  audioBase64: z.string().min(100).max(MAX_AUDIO_BASE64_LENGTH).regex(/^[A-Za-z0-9+/]+={0,2}$/, "Invalid base64 audio data."),
  language: LanguageSchema,
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data, context }) => {
    assertAiRateLimit(context.userId);
    const bytes = Buffer.from(data.audioBase64, "base64");
    const form = new FormData();
    form.append("model", "google/gemini-3.5-transcribe");
    form.append("file", new Blob([new Uint8Array(bytes)], { type: "audio/wav" }), "recording.wav");
    form.append("language", data.language);

    const res = await fetchWithTimeout(`${GATEWAY}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}` },
      body: form,
    });
    if (!res.ok) {
      const upstream = await res.text().catch(() => "");
      console.error("[AI] transcription request failed", res.status);
      throw new Error("Could not understand the recording. Please try again.");
    }
    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });

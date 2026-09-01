import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiGateway(apiKey: string) {
  const baseURL = process.env.AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
  return createOpenAICompatible({
    name: "cloud-gateway",
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
  });
}

export const createLovableGateway = createAiGateway;

export async function transcribeAudio(apiKey: string, audio: Blob, filename: string) {
  const form = new FormData();
  form.append("model", "openai/gpt-4o-transcribe");
  form.append(
    "prompt",
    "Transcribe rap/R&B punch-in vocals. Preserve every audible vocalization in order, including mumbles, hums, ad-libs, filler syllables like uh/um/yeah/aye, repeated words, and partial phrases. Do not summarize or clean up the performance.",
  );
  form.append("file", audio, filename);
  const baseURL = process.env.AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
  const res = await fetch(`${baseURL.replace(/\/+$/, "")}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}

// Central chat client for OpenAI-compatible LLMs.
// Automatically routes through local proxy relay when direct browser fetch
// fails (e.g. CORS block from Unsloth Studio, vLLM, or local servers).
// Handles reasoning_content from thinking models (Qwen, DeepSeek, etc.).

import { loadLlmConfig, chatTarget, type LlmConfig } from "./llm-config";
import { resolveTarget, applyBodyCompat, type TargetInput } from "./providers";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatClientOptions = {
  config?: LlmConfig;
  target?: TargetInput;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  repeat_penalty?: number;
};

export async function callChatLlm(opts: ChatClientOptions): Promise<string> {
  const config = opts.config ?? loadLlmConfig();
  const inputTarget = opts.target ?? chatTarget(config);
  const target = resolveTarget(inputTarget);

  if (!target.baseUrl || !target.model) {
    throw new Error("No LLM endpoint or model configured.");
  }

  const rawBody: Record<string, unknown> = {
    model: target.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 2048,
  };
  if (opts.top_p !== undefined) rawBody.top_p = opts.top_p;
  if (opts.repeat_penalty !== undefined) {
    rawBody.frequency_penalty = Math.max(0, opts.repeat_penalty - 1);
    (rawBody as { options?: Record<string, unknown> }).options = { repeat_penalty: opts.repeat_penalty };
  }

  const compatBody = applyBodyCompat(rawBody, target);

  // 1. Try direct fetch first
  try {
    const res = await fetch(`${target.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: target.headers,
      body: JSON.stringify(compatBody),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices?: { message?: { content?: string; reasoning_content?: string } }[];
      };
      const msg = json.choices?.[0]?.message;
      return msg?.content || msg?.reasoning_content || "";
    }
  } catch (err) {
    // If target is localhost / 127.0.0.1, fallback to server-side relay
    if (!/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(target.baseUrl)) {
      throw err;
    }
  }

  // 2. Local relay fallback (bypasses browser CORS for Unsloth, Ollama, vLLM)
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(target.baseUrl)) {
    const { proxyChatFn } = await import("./llm.functions");
    return await proxyChatFn({
      data: {
        baseUrl: target.baseUrl,
        model: target.model,
        apiKey: target.apiKey,
        body: compatBody,
      },
    });
  }

  throw new Error("Failed to communicate with LLM.");
}

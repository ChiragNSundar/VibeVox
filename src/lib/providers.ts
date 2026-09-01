// Provider registry for OpenAI-compatible LLM backends.
//
// Every backend the app talks to — a local Ollama/LM Studio server or a
// hosted gateway like OpenRouter — speaks the same `/chat/completions`
// shape. What differs is the base URL, the auth header, which extra body
// fields are tolerated, and whether embeddings/transcription exist at all.
// This file is the single place that knows those differences.
//
// `resolveTarget` collapses a user config into the four things the HTTP
// layer actually needs, so `rawChat`, `pingLlm` and the embedding client
// never branch on provider themselves.

export type ProviderId =
  | "local"
  | "openrouter"
  | "openai"
  | "groq"
  | "deepseek"
  | "mistral"
  | "together"
  | "google"
  | "gateway"
  | "custom";

export type Provider = {
  id: ProviderId;
  label: string;
  /** OpenAI-compatible root, no trailing slash. Empty for server-side providers. */
  baseUrl: string;
  needsKey: boolean;
  /** Runs through a server function rather than a browser fetch (Cloud gateway). */
  serverSide: boolean;
  /** Rejects unknown body params — drop `options`/`repeat_penalty` before sending. */
  strictBody: boolean;
  chat: boolean;
  embeddings: boolean;
  /** OpenAI-shaped `/audio/transcriptions`. */
  transcription: boolean;
  defaultModel: string;
  defaultEmbedModel?: string;
  /** Public model catalog, when one exists. */
  catalogUrl?: string;
  /** Whether the catalog needs the user's key. */
  catalogNeedsKey?: boolean;
  keyUrl?: string;
  keyPlaceholder?: string;
  hint?: string;
  headers?: (key: string) => Record<string, string>;
};

/** Referer/title are optional for OpenRouter but get you attributed usage. */
function openRouterHeaders(): Record<string, string> {
  const referer =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:8080";
  return { "HTTP-Referer": referer, "X-Title": "VoxScript" };
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  local: {
    id: "local",
    label: "Local server",
    baseUrl: "http://localhost:1234/v1",
    needsKey: false,
    serverSide: false,
    strictBody: false,
    chat: true,
    embeddings: true,
    transcription: false,
    defaultModel: "local-model",
    defaultEmbedModel: "nomic-embed-text",
    keyPlaceholder: "ollama / lm-studio",
    hint: "Ollama, LM Studio, llama.cpp or vLLM on your machine. Fully offline.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    serverSide: false,
    strictBody: false,
    chat: true,
    embeddings: false, // OpenRouter is chat-only — no /embeddings endpoint.
    transcription: false,
    defaultModel: "anthropic/claude-sonnet-4.5",
    catalogUrl: "https://openrouter.ai/api/v1/models",
    catalogNeedsKey: false,
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-v1-…",
    hint: "One key, ~300 models. Set a credit limit on the key — that caps your exposure.",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    needsKey: true,
    serverSide: false,
    strictBody: true,
    chat: true,
    embeddings: true,
    transcription: true,
    defaultModel: "gpt-5",
    defaultEmbedModel: "text-embedding-3-small",
    catalogUrl: "https://api.openai.com/v1/models",
    catalogNeedsKey: true,
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    serverSide: false,
    strictBody: true,
    chat: true,
    embeddings: false,
    transcription: true,
    defaultModel: "llama-3.3-70b-versatile",
    catalogUrl: "https://api.groq.com/openai/v1/models",
    catalogNeedsKey: true,
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_…",
    hint: "Very fast. Also hosts whisper-large-v3-turbo for cheap transcription.",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    needsKey: true,
    serverSide: false,
    strictBody: true,
    chat: true,
    embeddings: false,
    transcription: false,
    defaultModel: "deepseek-chat",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-…",
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    needsKey: true,
    serverSide: false,
    strictBody: true,
    chat: true,
    embeddings: true,
    transcription: false,
    defaultModel: "mistral-large-latest",
    defaultEmbedModel: "mistral-embed",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "…",
  },
  together: {
    id: "together",
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    needsKey: true,
    serverSide: false,
    strictBody: false,
    chat: true,
    embeddings: true,
    transcription: false,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    defaultEmbedModel: "BAAI/bge-base-en-v1.5",
    catalogUrl: "https://api.together.xyz/v1/models",
    catalogNeedsKey: true,
    keyUrl: "https://api.together.ai/settings/api-keys",
    keyPlaceholder: "…",
  },
  google: {
    id: "google",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    needsKey: true,
    serverSide: false,
    strictBody: true,
    chat: true,
    embeddings: true,
    transcription: false,
    defaultModel: "gemini-2.5-pro",
    defaultEmbedModel: "text-embedding-004",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza…",
    hint: "Gemini's OpenAI-compatibility endpoint.",
  },
  gateway: {
    id: "gateway",
    label: "Cloud AI Gateway",
    baseUrl: "",
    needsKey: false, // key lives in server environment
    serverSide: true,
    strictBody: true,
    chat: true,
    embeddings: true,
    transcription: true,
    defaultModel: "google/gemini-2.5-flash",
    defaultEmbedModel: "google/gemini-embedding-001",
    hint: "Routed through this app's server functions. Requires AI_GATEWAY_KEY in the deployment env.",
  },
  custom: {
    id: "custom",
    label: "Custom endpoint",
    baseUrl: "",
    needsKey: false,
    serverSide: false,
    strictBody: false,
    chat: true,
    embeddings: true,
    transcription: false,
    defaultModel: "",
    keyPlaceholder: "optional",
    hint: "Any OpenAI-compatible server. Enter the full /v1 root.",
  },
};

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS);

export function getProvider(id: ProviderId | string): Provider {
  return (PROVIDERS as Record<string, Provider>)[id] ?? PROVIDERS.custom;
}

/** Providers that can serve the generation pipeline, in menu order. */
export function chatProviders(): Provider[] {
  return PROVIDER_LIST.filter((p) => p.chat);
}

/** Providers that expose an /embeddings endpoint. */
export function embeddingProviders(): Provider[] {
  return PROVIDER_LIST.filter((p) => p.embeddings);
}

export function isLocalProvider(id: ProviderId): boolean {
  return id === "local";
}

// ---------------------------------------------------------------------------
// Target resolution
// ---------------------------------------------------------------------------

export type ResolvedTarget = {
  provider: Provider;
  /** Base URL with trailing slashes stripped. */
  baseUrl: string;
  model: string;
  apiKey: string;
  /** Ready to spread into a fetch `headers` object. */
  headers: Record<string, string>;
  strictBody: boolean;
};

export type TargetInput = {
  providerId: ProviderId;
  /** Overrides the preset — set when the user edits the URL or picks `custom`. */
  baseUrl?: string;
  model?: string;
  apiKey?: string;
};

/**
 * Collapse a provider selection into concrete request parameters.
 * Throws for server-side providers — those callers must take the
 * server-function path instead of building a fetch.
 */
export function resolveTarget(input: TargetInput): ResolvedTarget {
  const provider = getProvider(input.providerId);
  if (provider.serverSide) {
    throw new Error(`${provider.label} is server-side; call its server function instead of fetching directly.`);
  }
  const baseUrl = (input.baseUrl || provider.baseUrl).replace(/\/+$/, "");
  const apiKey = input.apiKey || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Local servers accept anything; send a filler so auth-requiring builds
  // (llama.cpp with --api-key) don't 401 on an empty bearer.
  const bearer = apiKey || (provider.needsKey ? "" : "local");
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (input.providerId === "openrouter") Object.assign(headers, openRouterHeaders());
  if (provider.headers && apiKey) Object.assign(headers, provider.headers(apiKey));

  return {
    provider,
    baseUrl,
    model: input.model || provider.defaultModel,
    apiKey,
    headers,
    strictBody: provider.strictBody,
  };
}

/**
 * o-series reasoning models reject the whole sampling block and renamed
 * `max_tokens`. Matched narrowly on purpose — a false positive silently
 * strips the temperature the writer pass depends on.
 */
function isReasoningModel(model: string): boolean {
  return /(^|\/)o[1345](-|$)/.test(model.toLowerCase());
}

/**
 * Normalize a request body for the target's quirks. Local servers accept
 * anything, so this is a no-op for them; hosted APIs 400 on unknown params.
 */
export function applyBodyCompat(
  body: Record<string, unknown>,
  target: Pick<ResolvedTarget, "strictBody" | "model">,
): Record<string, unknown> {
  const out = { ...body };

  if (target.strictBody) {
    // Ollama-style nested sampling — meaningless to hosted APIs, and OpenAI
    // rejects unknown top-level keys outright.
    delete out.options;
  }

  if (isReasoningModel(target.model)) {
    if ("max_tokens" in out) {
      out.max_completion_tokens = out.max_tokens;
      delete out.max_tokens;
    }
    delete out.temperature;
    delete out.top_p;
    delete out.frequency_penalty;
    delete out.presence_penalty;
  } else if (/gpt-5/.test(target.model.toLowerCase()) && "max_tokens" in out) {
    out.max_completion_tokens = out.max_tokens;
    delete out.max_tokens;
  }

  return out;
}

/** True when the target is missing a key it can't work without. */
export function missingKey(input: TargetInput): boolean {
  const provider = getProvider(input.providerId);
  return provider.needsKey && !(input.apiKey || "").trim();
}

// ---------------------------------------------------------------------------
// Remote model catalog
// ---------------------------------------------------------------------------

export type CatalogModel = {
  id: string;
  label: string;
  contextTokens?: number;
  /** USD per 1M prompt tokens, when the provider reports it. */
  promptPrice?: number;
  completionPrice?: number;
};

type OpenRouterModel = {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
};
type GenericModel = { id?: string; context_length?: number; context_window?: number };

/**
 * Fetch a provider's model list. OpenRouter returns rich metadata (context
 * and per-token pricing) without a key; everyone else returns bare ids.
 * Never throws for a missing catalog — returns an empty list so the UI can
 * fall back to free-text model entry.
 */
export async function fetchCatalog(input: TargetInput): Promise<CatalogModel[]> {
  const provider = getProvider(input.providerId);
  const url = provider.catalogUrl ?? (input.baseUrl ? `${input.baseUrl.replace(/\/+$/, "")}/models` : "");
  if (!url) return [];

  const headers: Record<string, string> = {};
  const key = (input.apiKey || "").trim();
  if (provider.catalogNeedsKey) {
    if (!key) return [];
    headers.Authorization = `Bearer ${key}`;
  } else if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Model list failed (${res.status})`);
  const json = (await res.json()) as { data?: unknown[] };
  const rows = Array.isArray(json.data) ? json.data : [];

  if (input.providerId === "openrouter") {
    return rows
      .map((r) => {
        const m = r as OpenRouterModel;
        const prompt = Number(m.pricing?.prompt ?? "");
        const completion = Number(m.pricing?.completion ?? "");
        return {
          id: String(m.id ?? ""),
          label: m.name ?? String(m.id ?? ""),
          contextTokens: typeof m.context_length === "number" ? m.context_length : undefined,
          // OpenRouter prices per token; scale to per-million for display.
          promptPrice: Number.isFinite(prompt) ? prompt * 1_000_000 : undefined,
          completionPrice: Number.isFinite(completion) ? completion * 1_000_000 : undefined,
        };
      })
      .filter((m) => m.id)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  return rows
    .map((r) => {
      const m = r as GenericModel;
      const id = String(m.id ?? "");
      return {
        id,
        label: id,
        contextTokens: m.context_length ?? m.context_window ?? undefined,
      };
    })
    .filter((m) => m.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

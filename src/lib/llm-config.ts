// User config for which LLM backend to use. Stored in localStorage.
//
// The axis is the *provider*, not local-vs-cloud: a local Ollama server and
// OpenRouter are both just OpenAI-compatible endpoints, and the pipeline
// treats them identically. See `src/lib/providers.ts` for the registry.
//
// Keys are held per-provider so switching backends and switching back
// doesn't lose credentials. Embeddings are configured separately because
// several chat providers (OpenRouter most notably) have no /embeddings
// endpoint at all — you can run chat on OpenRouter and keep vectors local.
//
// Transcription is likewise separate, so a user can run a hosted LLM but
// still transcribe on a local Whisper server, or go fully offline.

import {
  getProvider,
  isLocalProvider,
  resolveTarget,
  type ProviderId,
  type TargetInput,
} from "./providers";

export type LlmConfig = {
  /** Which backend serves the generation pipeline. */
  providerId: ProviderId;
  /** Overrides the provider preset. Empty = use the preset's base URL. */
  baseUrl: string;
  model: string;
  /** Per-provider API keys, so switching providers preserves each key. */
  apiKeys: Partial<Record<ProviderId, string>>;
  /** `direct` = browser → provider. `proxy` reserved for a server-side relay. */
  routing: "direct" | "proxy";

  /** Cached context length probed from the model — used for chunk planning. */
  contextTokens?: number;
  /** Optional family/tier override when auto-detection is wrong. */
  familyOverride?: string;
  tierOverride?: "small" | "mid" | "large";
  /** WebLLM model id, used when baseUrl is the "in-browser" sentinel. */
  inBrowserModel?: string;

  // Embeddings — independent of chat.
  embedProviderId: ProviderId;
  embedBaseUrl: string;
  embedModel: string;

  // Transcription
  transcriptionMode: "cloud" | "local" | "webgpu";
  whisperBaseUrl: string;
  whisperBackend: "faster-whisper" | "whisper.cpp" | "auto" | "in-browser";
  whisperModel: string;
  whisperLanguage: string;

  // Memory tuning — local mode can afford a much bigger few-shot library.
  localMemoryCap: number;
};

const KEY = "voxscript:llm-config";

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  providerId: "local",
  baseUrl: "http://localhost:1234/v1",
  model: "local-model",
  apiKeys: { local: "lm-studio" },
  routing: "direct",
  contextTokens: undefined,
  familyOverride: undefined,
  tierOverride: undefined,
  inBrowserModel: undefined,
  embedProviderId: "local",
  embedBaseUrl: "http://localhost:1234/v1",
  embedModel: "nomic-embed-text",
  transcriptionMode: "webgpu",
  whisperBaseUrl: "http://localhost:9000",
  whisperBackend: "in-browser",
  whisperModel: "whisper-base",
  whisperLanguage: "",
  localMemoryCap: 2000,
};

/** Old shape, pre provider-registry. Kept only for migration. */
type LegacyLlmConfig = {
  mode?: "cloud" | "local";
  localBaseUrl?: string;
  localModel?: string;
  localApiKey?: string;
  localContextTokens?: number;
  inBrowserModel?: string;
};

/** Best-effort provider guess from a saved base URL. */
function inferProvider(baseUrl: string): ProviderId {
  const url = baseUrl.toLowerCase();
  if (!url) return "local";
  // Sentinels the pipeline understands: in-browser WebLLM and zero-LLM RAG.
  if (url === "in-browser" || url === "offline" || url === "none") return "local";
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(url)) return "local";
  if (url.includes("openrouter.ai")) return "openrouter";
  if (url.includes("api.openai.com")) return "openai";
  if (url.includes("api.groq.com")) return "groq";
  if (url.includes("api.deepseek.com")) return "deepseek";
  if (url.includes("api.mistral.ai")) return "mistral";
  if (url.includes("together.xyz") || url.includes("together.ai")) return "together";
  if (url.includes("generativelanguage.googleapis.com")) return "google";
  return "custom";
}

/**
 * Upgrade a pre-registry config in place. The old shape had a single
 * `mode: "cloud" | "local"` where "cloud" meant the Cloud gateway, plus
 * `local*` fields that actually held whatever endpoint was configured.
 */
function migrate(raw: LegacyLlmConfig & Partial<LlmConfig>): LlmConfig {
  // Already migrated.
  if (raw.providerId) {
    const res = { ...DEFAULT_LLM_CONFIG, ...(raw as Partial<LlmConfig>) } as LlmConfig;
    if (res.providerId === "local" && (res.model?.includes("gemini") || res.model?.includes("gpt-") || res.model?.includes("claude"))) {
      res.model = res.baseUrl === "offline" ? "offline-rag" : "local-model";
    }
    return res;
  }

  const legacyUrl = raw.localBaseUrl ?? "";
  const wasCloud = raw.mode === "cloud";
  const providerId: ProviderId = wasCloud ? "gateway" : inferProvider(legacyUrl);
  const apiKeys: Partial<Record<ProviderId, string>> = {};
  if (raw.localApiKey) apiKeys[providerId] = raw.localApiKey;

  return {
    ...DEFAULT_LLM_CONFIG,
    ...(raw as Partial<LlmConfig>),
    providerId,
    baseUrl: legacyUrl || (wasCloud ? "" : DEFAULT_LLM_CONFIG.baseUrl),
    model: raw.localModel || getProvider(providerId).defaultModel,
    apiKeys,
    contextTokens: raw.localContextTokens,
    inBrowserModel: raw.inBrowserModel,
    // Old "cloud" mode meant Cloud gateway hosted embeddings.
    embedProviderId: wasCloud ? "gateway" : inferProvider(legacyUrl),
    embedBaseUrl: wasCloud ? "" : legacyUrl || DEFAULT_LLM_CONFIG.embedBaseUrl,
    embedModel: wasCloud ? "google/gemini-embedding-001" : DEFAULT_LLM_CONFIG.embedModel,
  };
}

export function loadLlmConfig(): LlmConfig {
  if (typeof localStorage === "undefined") return DEFAULT_LLM_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    return migrate(JSON.parse(raw));
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLlmConfig(config: LlmConfig) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(config));
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** The key stored for a provider (defaults to the active chat provider). */
export function keyFor(config: LlmConfig, providerId?: ProviderId): string {
  return config.apiKeys?.[providerId ?? config.providerId] ?? "";
}

export function setKeyFor(config: LlmConfig, providerId: ProviderId, key: string): LlmConfig {
  return { ...config, apiKeys: { ...config.apiKeys, [providerId]: key } };
}

/** Request parameters for the generation pipeline. */
export function chatTarget(config: LlmConfig): TargetInput {
  return {
    providerId: config.providerId,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey: keyFor(config),
  };
}

/** Request parameters for embeddings, which may use a different provider. */
export function embedTarget(config: LlmConfig): TargetInput {
  return {
    providerId: config.embedProviderId,
    baseUrl: config.embedBaseUrl,
    model: config.embedModel,
    apiKey: keyFor(config, config.embedProviderId),
  };
}

/**
 * Switch providers, moving the base URL and model to that provider's
 * preset unless the user has a custom endpoint.
 */
export function selectProvider(config: LlmConfig, providerId: ProviderId): LlmConfig {
  const provider = getProvider(providerId);
  return {
    ...config,
    providerId,
    baseUrl: provider.baseUrl,
    model: provider.defaultModel,
    // Context is model-specific — drop the stale probe.
    contextTokens: undefined,
  };
}

export function isLocalConfig(config: LlmConfig): boolean {
  return isLocalProvider(config.providerId);
}

/** True when the entire pipeline (LLM + STT) can run without internet. */
export function isOfflineReady(config: LlmConfig): boolean {
  return isLocalConfig(config) && config.transcriptionMode === "local";
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

let pingCache: { key: string; time: number; result: { ok: boolean; message: string } } | null = null;
let pingInFlight: Promise<{ ok: boolean; message: string }> | null = null;
const PING_CACHE_TTL_MS = 60_000;

export async function pingLlm(
  config: LlmConfig,
  options?: { force?: boolean },
): Promise<{ ok: boolean; message: string }> {
  if (config.baseUrl === "offline" || config.baseUrl === "none") {
    return { ok: true, message: "Zero-LLM RAG Engine active (Cadence segmentation + Local Brain)." };
  }
  const provider = getProvider(config.providerId);
  if (provider.serverSide) {
    return { ok: false, message: `${provider.label} runs server-side — nothing to ping from the browser.` };
  }
  if (provider.needsKey && !keyFor(config).trim()) {
    return { ok: false, message: `${provider.label} needs an API key.` };
  }

  let target: ReturnType<typeof resolveTarget>;
  try {
    target = resolveTarget(chatTarget(config));
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
  if (!target.baseUrl) return { ok: false, message: "No endpoint URL set." };

  const cacheKey = `${target.baseUrl}::${target.model}::${target.apiKey ?? ""}`;

  if (!options?.force) {
    const now = Date.now();
    if (pingCache && pingCache.key === cacheKey && now - pingCache.time < PING_CACHE_TTL_MS) {
      return pingCache.result;
    }
    if (pingInFlight) {
      return pingInFlight;
    }
  }

  const doPing = async (): Promise<{ ok: boolean; message: string }> => {
    const cleanBase = target.baseUrl.replace(/\/+$/, "");

    // 1. First attempt: Zero-GPU / zero-inference GET /models
    // Standard across Unsloth, Ollama, LM Studio, vLLM, OpenAI, OpenRouter, Groq
    try {
      const modelsUrl = cleanBase.endsWith("/v1") ? `${cleanBase}/models` : `${cleanBase}/v1/models`;
      const res = await fetch(modelsUrl, {
        method: "GET",
        headers: target.headers,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        return { ok: true, message: `Connected to ${provider.label} (${target.model || "Ready"}).` };
      }
    } catch {
      // Direct browser fetch failed (e.g. CORS block from Unsloth / local server on 127.0.0.1)
    }

    // 2. If direct browser fetch failed and target is local, use server-side relay
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(target.baseUrl)) {
      try {
        const { proxyPingFn } = await import("./llm.functions");
        const relayRes = await proxyPingFn({
          data: { baseUrl: target.baseUrl, model: target.model, apiKey: target.apiKey },
        });
        if (relayRes.ok) return relayRes;
      } catch {
        /* fall through */
      }
    }

    // 3. Fallback: try root models without /v1
    try {
      const altUrl = `${cleanBase}/models`;
      const res = await fetch(altUrl, { method: "GET", headers: target.headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        return { ok: true, message: `Connected to ${provider.label}.` };
      }
    } catch {
      /* fall through */
    }

    const hint = isLocalProvider(config.providerId)
      ? ". If you're using Ollama, run: OLLAMA_ORIGINS='*' ollama serve"
      : ". Check the key and that your network allows this host.";
    return { ok: false, message: `Could not reach ${target.baseUrl}${hint}` };
  };

  pingInFlight = doPing()
    .then((result) => {
      pingCache = { key: cacheKey, time: Date.now(), result };
      return result;
    })
    .finally(() => {
      pingInFlight = null;
    });

  return pingInFlight;
}

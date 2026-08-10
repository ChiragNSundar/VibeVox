// Client-side embedding facade with persistent cache.
//
// Two backends:
//   - "cloud" → calls the `embedTexts` server function (Lovable AI Gateway,
//     gemini-embedding-001 by default, 3072 dims).
//   - "direct" → POSTs to an OpenAI-compatible /v1/embeddings endpoint. That
//     may be local (Ollama, LM Studio — nomic-embed-text, 768 dims) or a
//     hosted provider that offers embeddings.
//
// Embeddings are configured independently of chat because several chat
// providers don't offer them at all — OpenRouter is chat-only, so running
// generation there while keeping vectors on a local Ollama is the normal
// setup, not an edge case. `embeddingsAvailable` is the guard for the case
// where no embedding backend is reachable; hybrid recall degrades to its
// lexical signals rather than failing.
//
// All callers go through `embedMany` / `embedOne`, which dedupes the request,
// checks the IDB cache for each text, fetches only the misses in one batch,
// and writes them back. The cache key is (backend + baseUrl + model + text)
// so swapping models or hosts doesn't return stale vectors.

import { cacheGet, cacheSet, hashInputs } from "./cache";
import { embedTarget, loadLlmConfig, type LlmConfig } from "./llm-config";
import { getProvider, resolveTarget } from "./providers";

export type EmbedBackend = "cloud" | "local";

export type EmbedContext = {
  /** "cloud" routes through the server function; "local" is a direct fetch. */
  backend: EmbedBackend;
  model: string;
  baseUrl?: string; // direct only
  apiKey?: string; // direct only
  /** Auth/attribution headers for the direct path. */
  headers?: Record<string, string>;
  /** False when the selected provider has no /embeddings endpoint. */
  supported: boolean;
};

const CLOUD_DEFAULT_MODEL = "google/gemini-embedding-001";

export function resolveEmbedContext(config: LlmConfig = loadLlmConfig()): EmbedContext {
  const input = embedTarget(config);
  const provider = getProvider(input.providerId);

  // Server-side gateway — no browser fetch, no base URL.
  if (provider.serverSide) {
    return { backend: "cloud", model: input.model || CLOUD_DEFAULT_MODEL, supported: true };
  }

  if (!provider.embeddings) {
    // e.g. OpenRouter selected for chat and carried over here. Report it as
    // unsupported so callers can skip vector recall instead of 404-looping.
    return { backend: "local", model: input.model ?? "", baseUrl: input.baseUrl, supported: false };
  }

  const target = resolveTarget(input);
  return {
    backend: "local",
    model: target.model || provider.defaultEmbedModel || "nomic-embed-text",
    baseUrl: target.baseUrl,
    apiKey: target.apiKey,
    headers: target.headers,
    supported: true,
  };
}

async function keyFor(ctx: EmbedContext, text: string): Promise<string> {
  return hashInputs([ctx.backend, ctx.baseUrl ?? "cloud", ctx.model, text]);
}

async function callLocal(ctx: EmbedContext, texts: string[]): Promise<number[][]> {
  if (!ctx.supported) {
    throw new Error(`Provider has no embeddings endpoint (model: ${ctx.model})`);
  }
  const url = `${(ctx.baseUrl ?? "").replace(/\/+$/, "")}/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: ctx.headers ?? {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.apiKey || "local"}`,
    },
    body: JSON.stringify({ model: ctx.model, input: texts }),
  });
  if (!res.ok) throw new Error(`Embed failed (${res.status})`);
  const json = (await res.json()) as { data?: { index?: number; embedding?: number[] }[] };
  const items = json.data ?? [];
  return texts.map((_, i) => {
    const it = items.find((x) => x.index === i) ?? items[i];
    if (!it?.embedding) throw new Error(`Missing local embedding at index ${i}`);
    return it.embedding;
  });
}

async function callCloud(texts: string[], model: string): Promise<number[][]> {
  // Dynamic import so this client file is safe to bundle without dragging
  // server-fn module shapes in unexpected places.
  const { embedTexts } = await import("./embeddings.functions");
  const out = await embedTexts({ data: { texts, model } });
  return out.vectors;
}

export async function embedMany(texts: string[], ctx?: EmbedContext): Promise<number[][]> {
  const context = ctx ?? resolveEmbedContext();
  if (!texts.length) return [];

  // Dedupe + cache lookup
  const cleaned = texts.map((t) => t.trim()).map((t) => (t.length > 6000 ? t.slice(0, 6000) : t));
  const keys = await Promise.all(cleaned.map((t) => keyFor(context, t)));
  const hits = await Promise.all(keys.map((k) => cacheGet<number[]>("embeddings", k)));

  const missesIdx: number[] = [];
  const missesText: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (!hits[i]) {
      missesIdx.push(i);
      missesText.push(cleaned[i]);
    }
  }

  let fresh: number[][] = [];
  if (missesText.length) {
    // Batch — cap at 32 per call to stay polite with both providers.
    const BATCH = 32;
    for (let i = 0; i < missesText.length; i += BATCH) {
      const slice = missesText.slice(i, i + BATCH);
      let vecs: number[][];
      if (context.backend === "local") {
        try {
          vecs = await callLocal(context, slice);
        } catch {
          vecs = await callCloud(slice, context.model);
        }
      } else {
        vecs = await callCloud(slice, context.model);
      }
      fresh.push(...vecs);
    }
    // Persist
    await Promise.all(
      missesIdx.map((origIdx, j) =>
        cacheSet("embeddings", keys[origIdx], fresh[j], { model: context.model, backend: context.backend }),
      ),
    );
  }

  // Assemble final ordered list
  const out: number[][] = new Array(cleaned.length);
  let missCursor = 0;
  for (let i = 0; i < cleaned.length; i++) {
    if (hits[i]) out[i] = hits[i] as number[];
    else out[i] = fresh[missCursor++];
  }
  return out;
}

export async function embedOne(text: string, ctx?: EmbedContext): Promise<number[]> {
  const [v] = await embedMany([text], ctx);
  return v;
}

export function cosineSim(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Lightweight availability probe — used to short-circuit recall when the
 * local user hasn't pulled an embedding model yet. Cloud is always available
 * when credits exist, so we just return true for cloud without a roundtrip.
 */
export async function embeddingsAvailable(config: LlmConfig = loadLlmConfig()): Promise<boolean> {
  const ctx = resolveEmbedContext(config);
  if (!ctx.supported) return false;
  if (ctx.backend === "cloud") return true;
  try {
    await embedOne("ping", ctx);
    return true;
  } catch {
    return false;
  }
}

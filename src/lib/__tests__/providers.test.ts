import { describe, it, expect, beforeEach } from "vitest";

import { applyBodyCompat, fetchCatalog, resolveTarget, missingKey } from "../providers";
import { DEFAULT_LLM_CONFIG, loadLlmConfig, saveLlmConfig, chatTarget, embedTarget, keyFor, selectProvider, type LlmConfig } from "../llm-config";
import { detectModel, tierFor, profileFor, budgetForProfile, budgetFor } from "../local-profiles";
import { resolveEmbedContext } from "../embeddings";

describe("resolveTarget", () => {
  it("uses the provider preset when no override is set", () => {
    const t = resolveTarget({ providerId: "openrouter", apiKey: "sk-or-test" });
    expect(t.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(t.model).toBe("anthropic/claude-sonnet-4.5");
    expect(t.headers.Authorization).toBe("Bearer sk-or-test");
  });

  it("attaches OpenRouter attribution headers", () => {
    const t = resolveTarget({ providerId: "openrouter", apiKey: "k" });
    expect(t.headers["X-Title"]).toBe("VoxScript");
    expect(t.headers["HTTP-Referer"]).toBeTruthy();
  });

  it("strips trailing slashes from a custom base URL", () => {
    const t = resolveTarget({ providerId: "custom", baseUrl: "http://box.local:9000/v1///" });
    expect(t.baseUrl).toBe("http://box.local:9000/v1");
  });

  it("sends a filler bearer for keyless local servers", () => {
    // llama.cpp built with --api-key 401s on an empty Authorization header.
    const t = resolveTarget({ providerId: "local" });
    expect(t.headers.Authorization).toBe("Bearer local");
  });

  it("omits Authorization when a key-requiring provider has no key", () => {
    const t = resolveTarget({ providerId: "openai" });
    expect(t.headers.Authorization).toBeUndefined();
  });

  it("refuses to build a fetch for server-side providers", () => {
    expect(() => resolveTarget({ providerId: "lovable" })).toThrow(/server-side/i);
  });
});

describe("missingKey", () => {
  it("flags a hosted provider with a blank key", () => {
    expect(missingKey({ providerId: "openrouter", apiKey: "   " })).toBe(true);
    expect(missingKey({ providerId: "openrouter", apiKey: "sk-or-x" })).toBe(false);
  });

  it("never flags local", () => {
    expect(missingKey({ providerId: "local" })).toBe(false);
  });
});

describe("applyBodyCompat", () => {
  const body = {
    model: "m",
    temperature: 0.85,
    top_p: 0.95,
    max_tokens: 4096,
    frequency_penalty: 0.15,
    options: { repeat_penalty: 1.15 },
  };

  it("keeps Ollama's nested sampling for permissive backends", () => {
    const out = applyBodyCompat(body, { strictBody: false, model: "qwen2.5:14b" });
    expect(out.options).toEqual({ repeat_penalty: 1.15 });
    expect(out.max_tokens).toBe(4096);
  });

  it("drops unknown params for strict providers", () => {
    // OpenAI 400s on unknown top-level keys rather than ignoring them.
    const out = applyBodyCompat(body, { strictBody: true, model: "gpt-4o" });
    expect(out.options).toBeUndefined();
    expect(out.temperature).toBe(0.85);
    expect(out.max_tokens).toBe(4096);
  });

  it("renames max_tokens and strips sampling for o-series reasoning models", () => {
    const out = applyBodyCompat(body, { strictBody: true, model: "o3-mini" });
    expect(out.max_tokens).toBeUndefined();
    expect(out.max_completion_tokens).toBe(4096);
    expect(out.temperature).toBeUndefined();
    expect(out.top_p).toBeUndefined();
    expect(out.frequency_penalty).toBeUndefined();
  });

  it("renames max_tokens for gpt-5 but keeps temperature", () => {
    const out = applyBodyCompat(body, { strictBody: true, model: "openai/gpt-5" });
    expect(out.max_completion_tokens).toBe(4096);
    expect(out.temperature).toBe(0.85);
  });

  it("does not treat a model merely containing 'o1' as reasoning", () => {
    const out = applyBodyCompat(body, { strictBody: true, model: "some-o1x-model" });
    expect(out.max_tokens).toBe(4096);
    expect(out.temperature).toBe(0.85);
  });
});

describe("hosted model detection", () => {
  it("pins frontier models to the large tier despite having no size in the id", () => {
    for (const id of ["anthropic/claude-sonnet-4.5", "openai/gpt-5", "google/gemini-2.5-pro", "x-ai/grok-4"]) {
      const { family, paramsB } = detectModel(id);
      expect(paramsB).toBe(0);
      expect(tierFor(paramsB, family)).toBe("large");
      expect(profileFor(id).writeFormat).toBe("json");
    }
  });

  it("gives frontier models a real context window, not the 8K fallback", () => {
    expect(profileFor("anthropic/claude-sonnet-4.5").defaultContextTokens).toBeGreaterThan(100_000);
    expect(profileFor("openai/gpt-5").defaultContextTokens).toBeGreaterThan(100_000);
  });

  it("still size-parses open-weights models behind a vendor prefix", () => {
    const d = detectModel("meta-llama/Llama-3.3-70B-Instruct-Turbo");
    expect(d.family).toBe("llama");
    expect(d.paramsB).toBe(70);
    expect(tierFor(d.paramsB, d.family)).toBe("large");
  });

  it("treats gpt-oss as open-weights, not hosted GPT", () => {
    const d = detectModel("openai/gpt-oss-120b");
    expect(d.paramsB).toBe(120);
  });

  it("leaves local detection unchanged", () => {
    expect(detectModel("qwen2.5:14b")).toEqual({ family: "qwen", paramsB: 14 });
    expect(tierFor(14)).toBe("mid");
  });

  it("caps the critic loop for hosted models, which bill per call", () => {
    const hosted = budgetForProfile(profileFor("anthropic/claude-sonnet-4.5"));
    const local = budgetForProfile(profileFor("llama3.3:70b"));
    expect(hosted.maxIterations).toBe(3);
    expect(local.maxIterations).toBe(budgetFor("large").maxIterations);
  });
});

describe("config migration", () => {
  beforeEach(() => localStorage.clear());

  it("returns defaults with no saved config", () => {
    expect(loadLlmConfig()).toEqual(DEFAULT_LLM_CONFIG);
  });

  it("infers a provider from a legacy base URL and rehomes the key", () => {
    localStorage.setItem(
      "voxscript:llm-config",
      JSON.stringify({
        mode: "local",
        localBaseUrl: "https://openrouter.ai/api/v1",
        localModel: "anthropic/claude-sonnet-4.5",
        localApiKey: "sk-or-legacy",
        localContextTokens: 200000,
      }),
    );
    const cfg = loadLlmConfig();
    expect(cfg.providerId).toBe("openrouter");
    expect(cfg.model).toBe("anthropic/claude-sonnet-4.5");
    expect(cfg.contextTokens).toBe(200000);
    expect(keyFor(cfg)).toBe("sk-or-legacy");
  });

  it("maps a legacy localhost config to the local provider", () => {
    localStorage.setItem(
      "voxscript:llm-config",
      JSON.stringify({ mode: "local", localBaseUrl: "http://localhost:11434/v1", localModel: "qwen2.5:14b", localApiKey: "ollama" }),
    );
    const cfg = loadLlmConfig();
    expect(cfg.providerId).toBe("local");
    expect(cfg.baseUrl).toBe("http://localhost:11434/v1");
    expect(keyFor(cfg)).toBe("ollama");
  });

  it("maps the legacy cloud mode onto the Lovable gateway", () => {
    localStorage.setItem("voxscript:llm-config", JSON.stringify({ mode: "cloud" }));
    const cfg = loadLlmConfig();
    expect(cfg.providerId).toBe("lovable");
    expect(resolveEmbedContext(cfg).backend).toBe("cloud");
  });

  it("preserves the pipeline's offline sentinels", () => {
    localStorage.setItem("voxscript:llm-config", JSON.stringify({ mode: "local", localBaseUrl: "offline" }));
    const cfg = loadLlmConfig();
    expect(cfg.baseUrl).toBe("offline");
    expect(cfg.providerId).toBe("local");
  });

  it("leaves an already-migrated config alone", () => {
    const saved = { ...DEFAULT_LLM_CONFIG, providerId: "groq" as const, model: "llama-3.3-70b-versatile" };
    saveLlmConfig(saved);
    const cfg = loadLlmConfig();
    expect(cfg.providerId).toBe("groq");
    expect(cfg.model).toBe("llama-3.3-70b-versatile");
  });
});

describe("per-provider keys", () => {
  it("keeps each provider's key when switching back and forth", () => {
    let cfg: LlmConfig = { ...DEFAULT_LLM_CONFIG, apiKeys: { openrouter: "sk-or", groq: "gsk-1" } };
    cfg = selectProvider(cfg, "openrouter");
    expect(keyFor(cfg)).toBe("sk-or");
    cfg = selectProvider(cfg, "groq");
    expect(keyFor(cfg)).toBe("gsk-1");
    cfg = selectProvider(cfg, "openrouter");
    expect(keyFor(cfg)).toBe("sk-or");
  });

  it("clears the probed context when the provider changes", () => {
    const cfg = selectProvider({ ...DEFAULT_LLM_CONFIG, contextTokens: 8192 }, "openrouter");
    expect(cfg.contextTokens).toBeUndefined();
  });

  it("resolves chat and embeddings independently", () => {
    const cfg = {
      ...DEFAULT_LLM_CONFIG,
      providerId: "openrouter" as const,
      model: "anthropic/claude-sonnet-4.5",
      apiKeys: { openrouter: "sk-or", local: "ollama" },
      embedProviderId: "local" as const,
      embedBaseUrl: "http://localhost:11434/v1",
      embedModel: "nomic-embed-text",
    };
    expect(chatTarget(cfg).providerId).toBe("openrouter");
    expect(embedTarget(cfg).providerId).toBe("local");
    expect(embedTarget(cfg).apiKey).toBe("ollama");
  });
});

describe("embeddings capability", () => {
  it("reports unsupported when the selected provider has no embeddings endpoint", () => {
    // OpenRouter is chat-only; recall must degrade rather than 404-loop.
    const ctx = resolveEmbedContext({
      ...DEFAULT_LLM_CONFIG,
      embedProviderId: "openrouter",
      embedBaseUrl: "",
      embedModel: "whatever",
      apiKeys: { openrouter: "sk-or" },
    });
    expect(ctx.supported).toBe(false);
  });

  it("resolves a local embedding endpoint with auth headers", () => {
    const ctx = resolveEmbedContext({
      ...DEFAULT_LLM_CONFIG,
      embedProviderId: "local",
      embedBaseUrl: "http://localhost:11434/v1",
      embedModel: "nomic-embed-text",
    });
    expect(ctx.supported).toBe(true);
    expect(ctx.baseUrl).toBe("http://localhost:11434/v1");
    expect(ctx.headers?.["Content-Type"]).toBe("application/json");
  });
});

describe("fetchCatalog", () => {
  it("normalizes OpenRouter pricing to dollars per million tokens", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [
            { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", context_length: 200000, pricing: { prompt: "0.000003", completion: "0.000015" } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;
    try {
      const list = await fetchCatalog({ providerId: "openrouter" });
      expect(list).toHaveLength(1);
      expect(list[0].contextTokens).toBe(200000);
      expect(list[0].promptPrice).toBeCloseTo(3);
      expect(list[0].completionPrice).toBeCloseTo(15);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("returns nothing when a key-gated catalog has no key", async () => {
    await expect(fetchCatalog({ providerId: "openai" })).resolves.toEqual([]);
  });
});

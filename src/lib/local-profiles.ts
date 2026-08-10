// Model-aware tuning for local LLM pipelines.
//
// Mid-tier (13–32B) local models can't be prompted exactly like Gemini —
// they need stronger format anchoring, smaller chunks (limited context),
// and per-pass sampling discipline. This file maps a model id to:
//
//   - family   (qwen / llama / mistral / deepseek / gemma / phi / other)
//   - tier     (small / mid / large) derived from parameter count in the id
//   - profile  (system-prompt style + preferred output format + sampling)
//   - budget   (critic/refine iterations + Drake-tier target)
//
// Everything is best-effort: we never block on a probe and always have a
// safe fallback. Users can override family/tier in Settings if detection
// is wrong.

export type LocalFamily =
  | "qwen"
  | "llama"
  | "mistral"
  | "deepseek"
  | "gemma"
  | "phi"
  | "command-r"
  | "yi"
  | "other"
  // Hosted frontier families. These have no parameter count in their id, so
  // the size heuristics below can't rank them — they're pinned to `large`.
  | "gpt"
  | "claude"
  | "gemini"
  | "grok";

export type LocalTier = "small" | "mid" | "large";

const HOSTED_FAMILIES: ReadonlySet<LocalFamily> = new Set<LocalFamily>(["gpt", "claude", "gemini", "grok"]);

/** True for API-only frontier models (billed per call, no local weights). */
export function isHostedFamily(family: LocalFamily): boolean {
  return HOSTED_FAMILIES.has(family);
}

/** Preferred response format for the writer pass. */
export type WriteFormat = "json" | "xml" | "markdown";

export type LocalProfile = {
  family: LocalFamily;
  tier: LocalTier;
  /** Approximate parameter count in billions, parsed from the model id. */
  paramsB: number;
  /** Format the writer pass should request. */
  writeFormat: WriteFormat;
  /** Suggested context window for chunk planning (overridden by probe). */
  defaultContextTokens: number;
  /** Per-pass sampling. Locals benefit from very different temperatures per stage. */
  sampling: {
    cadence: { temperature: number; top_p?: number };
    write: { temperature: number; top_p?: number; repeat_penalty?: number };
    editor: { temperature: number; top_p?: number };
    critic: { temperature: number; top_p?: number };
  };
};

export type IterationBudget = {
  /** Max critic→refine loops. */
  maxIterations: number;
  /** Score that lets us stop early. */
  targetScore: number;
  /** Score threshold to harvest into style memory during training. */
  harvestThreshold: number;
  /** Bars per writer chunk. */
  chunkBars: number;
};

/**
 * Parse "qwen2.5:14b", "llama3.1-70b-instruct-q4", "mixtral:8x7b",
 * "anthropic/claude-sonnet-4.5", "openai/gpt-5" → {family, paramsB}.
 *
 * Hosted ids are matched first: a gateway prefixes them with a vendor
 * ("openai/", "google/"), and the local heuristics would otherwise fall
 * through to family "other" with paramsB 0 — which reads as mid-tier and
 * gives a frontier model 8K of assumed context.
 */
export function detectModel(modelId: string): { family: LocalFamily; paramsB: number } {
  const id = modelId.toLowerCase();

  const hosted: LocalFamily | null =
    /claude|sonnet|opus|haiku/.test(id) ? "claude"
    : /gemini/.test(id) ? "gemini"
    : /grok/.test(id) ? "grok"
    // `gpt-oss-*` is open-weights — let it fall through to the size parser.
    : /gpt/.test(id) && !/gpt-oss/.test(id) ? "gpt"
    : /(^|\/)o[1345](-|$)/.test(id) ? "gpt"
    : null;
  if (hosted) return { family: hosted, paramsB: 0 };

  const family: LocalFamily =
    /qwen/.test(id) ? "qwen"
    : /llama/.test(id) ? "llama"
    : /mixtral|mistral/.test(id) ? "mistral"
    : /deepseek/.test(id) ? "deepseek"
    : /gemma/.test(id) ? "gemma"
    : /phi/.test(id) ? "phi"
    : /command-?r/.test(id) ? "command-r"
    : /yi[-:]/.test(id) ? "yi"
    : "other";

  // Mixtral "8x7b" → effective ~47B routed, treat as mid+.
  const mix = id.match(/(\d+)x(\d+)b/);
  if (mix) return { family, paramsB: Number(mix[1]) * Number(mix[2]) * 0.6 };

  const m = id.match(/(\d+(?:\.\d+)?)\s*b\b/);
  const paramsB = m ? Number(m[1]) : 0;
  return { family, paramsB };
}

export function tierFor(paramsB: number, family?: LocalFamily): LocalTier {
  // Hosted frontier models carry no size in their id but are all at or above
  // the capability of a 70B local — treat them as large regardless.
  if (family && isHostedFamily(family)) return "large";
  if (paramsB <= 0) return "mid"; // unknown → assume mid; user can override
  if (paramsB <= 9) return "small";
  if (paramsB <= 40) return "mid";
  return "large";
}

/**
 * Format preference per family at 13–32B scale, based on what actually
 * round-trips cleanly through the OpenAI-compatible /chat/completions
 * shape at temperature ≥ 0.7:
 *   - Llama 3.x at 8–70B: produces dramatically cleaner output when asked
 *     for XML tags than for raw JSON. JSON mode at this size frequently
 *     emits trailing commentary or unescaped quotes.
 *   - Qwen 2.5 / DeepSeek: native JSON-mode trained, ship with structured
 *     output finetuning, JSON is the highest-fidelity path.
 *   - Mistral / Mixtral: tolerate both but XML retries less.
 *   - Gemma / Phi / others: default to markdown labels, easiest to repair.
 */
function preferredFormat(family: LocalFamily): WriteFormat {
  switch (family) {
    // Frontier hosted models all honour a strict JSON contract; there's no
    // reason to spend tokens on the XML/markdown repair paths.
    case "gpt":
    case "claude":
    case "gemini":
    case "grok":
    case "qwen":
    case "deepseek":
      return "json";
    case "llama":
      return "xml";
    case "mistral":
      return "xml";
    case "gemma":
    case "phi":
      return "markdown";
    default:
      return "json";
  }
}

function defaultContext(family: LocalFamily, paramsB: number): number {
  // Conservative defaults; replaced by actual probe value when available.
  // Hosted values are deliberately under the advertised maximum — the
  // catalog fills in the real number when the user picks from the list.
  if (family === "claude") return 200_000;
  if (family === "gemini") return 1_000_000;
  if (family === "gpt") return 128_000;
  if (family === "grok") return 128_000;
  if (family === "qwen") return 32_768;
  if (family === "deepseek") return 16_384;
  if (family === "llama" && paramsB >= 70) return 128_000;
  if (family === "llama") return 8_192;
  if (family === "mistral") return 32_768;
  if (family === "gemma") return 8_192;
  if (family === "phi") return 16_384;
  return 8_192;
}

export function profileFor(modelId: string): LocalProfile {
  const { family, paramsB } = detectModel(modelId);
  return {
    family,
    tier: tierFor(paramsB, family),
    paramsB,
    writeFormat: preferredFormat(family),
    defaultContextTokens: defaultContext(family, paramsB),
    sampling: {
      // Analytical: low randomness so syllable counts/end-sounds are stable.
      cadence: { temperature: 0.2, top_p: 0.9 },
      // Creative: higher temp + repetition penalty so we don't loop on the
      // same end-sound or filler word across bars.
      write: { temperature: 0.85, top_p: 0.95, repeat_penalty: 1.15 },
      // Surgical: rewrites should preserve voice, not invent new directions.
      editor: { temperature: 0.4, top_p: 0.9 },
      // Deterministic: scoring must be stable across runs.
      critic: { temperature: 0.1, top_p: 0.8 },
    },
  };
}

export function budgetFor(tier: LocalTier): IterationBudget {
  switch (tier) {
    case "small":
      // 7–8B can't refine forever; cap loops and lower the target so we
      // don't burn an hour chasing 8.5 the model can't reach.
      return { maxIterations: 2, targetScore: 7.5, harvestThreshold: 7.5, chunkBars: 12 };
    case "mid":
      return { maxIterations: 4, targetScore: 8.5, harvestThreshold: 8.0, chunkBars: 16 };
    case "large":
      return { maxIterations: 6, targetScore: 9.0, harvestThreshold: 8.5, chunkBars: 20 };
  }
}

/**
 * Same budget, adjusted for who's paying. Hosted models bill per call, and
 * the critic→refine loop is the most expensive part of the pipeline — six
 * iterations against a frontier model is real money for a run that usually
 * clears the target score on the second pass.
 */
export function budgetForProfile(profile: LocalProfile): IterationBudget {
  const base = budgetFor(profile.tier);
  if (!isHostedFamily(profile.family)) return base;
  return { ...base, maxIterations: 3 };
}

/**
 * Pick a writer chunk size that fits inside the available context. We
 * reserve room for the system prompt, cadence block, and the model's own
 * output (assumed roughly equal to the input bars).
 *   ~80 tokens per bar of context (input cadence + few-shot + output).
 */
export function adaptiveChunkBars(contextTokens: number, base: number): number {
  if (!contextTokens || contextTokens <= 0) return base;
  const reserved = 2_000; // system + brief + style memory examples
  const usable = Math.max(1_000, contextTokens - reserved);
  const fits = Math.floor(usable / 160); // 80 in + 80 out per bar
  return Math.max(4, Math.min(base, fits));
}

/** Family-specific writer system-prompt suffix that nudges output shape. */
export function formatHint(profile: LocalProfile): string {
  switch (profile.writeFormat) {
    case "json":
      return [
        "OUTPUT FORMAT: a single JSON object only.",
        'Shape: {"title":"string","sections":[{"type":"verse|hook|bridge|intro|outro","lines":["bar text"]}]}',
        "No markdown, no code fences, no commentary before or after the JSON.",
      ].join(" ");
    case "xml":
      return [
        "OUTPUT FORMAT: XML tags only. Wrap output as:",
        "<lyrics><title>Short Title</title>",
        '<section type="verse"><bar>line 1</bar><bar>line 2</bar></section>',
        "</lyrics>",
        "No prose before or after the <lyrics> block.",
      ].join("\n");
    case "markdown":
      return [
        "OUTPUT FORMAT: labeled markdown only. Use exactly:",
        "TITLE: Short Title",
        "[VERSE]",
        "bar 1",
        "bar 2",
        "[HOOK]",
        "bar 3",
        "No commentary. No extra punctuation. One bar per line.",
      ].join("\n");
  }
}

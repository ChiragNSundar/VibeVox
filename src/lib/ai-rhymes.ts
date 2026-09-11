// AI Rhyme, Doppelreim & Wordplay Engine
// Uses active LLM (Unsloth, Ollama, LM Studio, or hosted) to generate
// creative multi-syllable rhymes, slant assonances, street slang, and rhyming bars.
// Optimized with <think> tag skipping and clean output filtering.

import { callChatLlm } from "./chat-client";
import { cacheGet, cacheSet, hashInputs } from "./cache";
import { countSyllables } from "./lyrics-analysis";
import { loadLlmConfig } from "./llm-config";
import { lookupRhymes, type RhymeHit } from "./rhymes";

export type AiRhymeItem = {
  word: string;
  syllables?: number;
  type?: "multi" | "slant" | "slang" | "bar";
  meaning?: string;
};

export type AiRhymeGroup = {
  category: "multi" | "slant" | "slang" | "bars";
  title: string;
  items: AiRhymeItem[];
};

export type AiRhymeResult = {
  query: string;
  groups: AiRhymeGroup[];
  model: string;
};

const FAST_PROMPT_TEMPLATE = `Target: "{WORD}". {CONTEXT}
Return compact hip-hop rhymes for "{WORD}". 3 multi-syllables, 3 slant assonances, 2 street slang words, 2 punchline bars.
Output valid JSON only with this schema:
{
  "multi": [{"word": "word", "syllables": 2}],
  "slant": [{"word": "word", "syllables": 2}],
  "slang": [{"word": "word", "meaning": "short note"}],
  "bars": [{"word": "rhyming bar ending in rhyme"}]
}
Direct JSON only. No thinking, no markdown fences, no preamble.`;

/** Fallback generator using local rhymes & phonetics if LLM times out */
async function buildLocalFastRhymeFallback(targetWord: string): Promise<AiRhymeResult> {
  const clean = targetWord.trim().toLowerCase();
  let hits: RhymeHit[] = [];
  try {
    hits = await lookupRhymes(clean);
  } catch {
    hits = [];
  }

  const cleanWordStr = (raw: string) => raw.replace(/\s*\(.*?\)/g, "").trim();

  const multi = hits
    .filter((h) => (h.syllables || countSyllables(h.word)) >= 2 && h.word.toLowerCase() !== clean)
    .slice(0, 6)
    .map((h) => ({
      word: cleanWordStr(h.word),
      syllables: h.syllables || countSyllables(h.word),
      type: "multi" as const,
    }))
    .filter((h) => h.word.length > 0);

  const slant = hits
    .filter((h) => h.kind === "near" || h.kind === "sound-like")
    .slice(0, 6)
    .map((h) => ({
      word: cleanWordStr(h.word),
      syllables: h.syllables || countSyllables(h.word),
      type: "slant" as const,
    }))
    .filter((h) => h.word.length > 0);

  const slang = hits
    .filter((h) => h.kind === "related")
    .slice(0, 4)
    .map((h) => ({
      word: cleanWordStr(h.word),
      meaning: "Related vibe / cadence",
      type: "slang" as const,
    }))
    .filter((h) => h.word.length > 0);

  const topRhyme = multi[0]?.word || slant[0]?.word || clean;
  const bars = [
    { word: `Stepping in the circle with the focus so defined, keeping every dollar that is rightfully ${clean}`, type: "bar" as const },
    { word: `Chasing every vision that was buried in the grind, never looking backward till they recognize the ${topRhyme}`, type: "bar" as const },
  ];

  return {
    query: targetWord,
    model: "Local Phonetic Engine",
    groups: [
      { category: "multi", title: "Multi-Syllable (Doppelreim)", items: multi },
      { category: "slant", title: "Slant & Assonance", items: slant },
      { category: "slang", title: "Street Slang & DHH", items: slang },
      { category: "bars", title: "Punchline Rhyming Bars", items: bars },
    ],
  };
}

export async function generateAiRhymes(
  targetWord: string,
  options: { context?: string; bypassCache?: boolean } = {}
): Promise<AiRhymeResult> {
  const cleanWord = targetWord.trim();
  if (!cleanWord) {
    return { query: "", groups: [], model: "" };
  }

  const config = loadLlmConfig();
  const contextStr = options.context ? `Surrounding context: "${options.context}"` : "";

  const cacheKey = options.bypassCache
    ? ""
    : await hashInputs(["ai-rhymes", config.model, cleanWord, options.context ?? ""]);

  if (cacheKey) {
    const cached = await cacheGet<AiRhymeResult>("chat", cacheKey);
    if (cached) return cached;
  }

  const prompt = FAST_PROMPT_TEMPLATE.replace("{WORD}", cleanWord).replace("{CONTEXT}", contextStr);

  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("LLM response timed out")), 12000)
    );

    const callPromise = callChatLlm({
      config,
      messages: [
        { role: "system", content: "You are an ultra-fast hip-hop rhyming dictionary. Respond ONLY with compact JSON without any thinking or preamble." },
        { role: "user", content: prompt },
        { role: "assistant", content: "<think>\n</think>\n{" },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    let raw = await Promise.race([callPromise, timeoutPromise]);
    // Ensure leading brace if assistant prefill didn't include it
    if (!raw.trim().startsWith("{")) raw = "{" + raw;

    let parsed: any = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      /* fallback */
    }

    const formatItems = (arr: any[], type: AiRhymeItem["type"]): AiRhymeItem[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((item) => {
          if (typeof item === "string") {
            const clean = item.replace(/\s*\(.*?\)/g, "").trim();
            return { word: clean, syllables: countSyllables(clean), type };
          }
          if (item && typeof item === "object") {
            const clean = String(item.word || "").replace(/\s*\(.*?\)/g, "").trim();
            return {
              word: clean,
              syllables: Number(item.syllables) || countSyllables(clean),
              type,
              meaning: item.meaning ? String(item.meaning) : undefined,
            };
          }
          return null;
        })
        .filter((i): i is AiRhymeItem => Boolean(i && i.word && i.word.length > 0));
    };

    const multiItems = formatItems(parsed?.multi, "multi");
    const slantItems = formatItems(parsed?.slant, "slant");

    // If LLM returned empty arrays, fall through to local phonetic engine
    if (multiItems.length === 0 && slantItems.length === 0) {
      return await buildLocalFastRhymeFallback(cleanWord);
    }

    const groups: AiRhymeGroup[] = [
      {
        category: "multi",
        title: "Multi-Syllable (Doppelreim)",
        items: multiItems,
      },
      {
        category: "slant",
        title: "Slant & Assonance",
        items: slantItems,
      },
      {
        category: "slang",
        title: "Street Slang & DHH",
        items: formatItems(parsed?.slang, "slang"),
      },
      {
        category: "bars",
        title: "Punchline Rhyming Bars",
        items: formatItems(parsed?.bars, "bar"),
      },
    ];

    const result: AiRhymeResult = {
      query: cleanWord,
      groups,
      model: config.model || "Custom Model",
    };

    if (cacheKey) {
      await cacheSet("chat", cacheKey, result, 1000 * 60 * 60 * 24 * 7);
    }

    return result;
  } catch (err) {
    console.warn("AI rhyme generation fallback:", err);
    return await buildLocalFastRhymeFallback(cleanWord);
  }
}

export async function generateGhostwriteNextBars(
  currentLyrics: string,
  options: { count?: number; style?: string } = {}
): Promise<string[]> {
  const trimmed = currentLyrics.trim();
  if (!trimmed) return [];

  const config = loadLlmConfig();
  const count = options.count ?? 2;

  // Take the last 4-6 lines for context
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const contextLines = lines.slice(-4).join("\n");
  const lastLine = lines[lines.length - 1] || "";

  const prompt = `Artist's latest lines:
"""
${contextLines}
"""
Write exactly ${count} new punchy rap bars continuing the flow and rhyming with the last bar ("${lastLine}").
Output only the new lyric lines.`;

  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Ghostwrite timed out")), 14000)
    );

    const callPromise = callChatLlm({
      config,
      messages: [
        { role: "system", content: "You are an elite hip-hop ghostwriter. Output ONLY the new lyric bars. No thinking, no commentary." },
        { role: "user", content: prompt },
        { role: "assistant", content: "<think>\n</think>\n" },
      ],
      temperature: 0.75,
      max_tokens: 220,
    });

    const raw = await Promise.race([callPromise, timeoutPromise]);

    const resultLines = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .split("\n")
      .map((l) => l.trim().replace(/^[-*#\d.]+\s*/, "").replace(/^["']|["']$/g, ""))
      .filter((l) => {
        const lower = l.toLowerCase();
        return (
          l.length > 5 &&
          !/^(here are|verse|hook|bar \d|<think>|we need|need to|need ensure|output only)/i.test(lower) &&
          !lower.includes("user's request") &&
          !lower.includes("rhyme with") &&
          !lower.endsWith(":")
        );
      })
      .slice(0, count);

    if (resultLines.length > 0) return resultLines;
  } catch (e) {
    console.warn("Ghostwrite fallback:", e);
  }

  // Fallback: cadence-locked clean algorithmic bar continuation (no dictionary parentheticals)
  const lastWord = lastLine.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const rhymes = await lookupRhymes(lastWord).catch(() => []);
  const rawRhymeWord = rhymes[0]?.word || "grind";
  const cleanRhymeWord = rawRhymeWord.replace(/\s*\(.*?\)/g, "").trim() || "grind";

  return [
    `Locked into the cadence till the whole design align`,
    `Standing in the pressure turning static into ${cleanRhymeWord}`,
  ].slice(0, count);
}

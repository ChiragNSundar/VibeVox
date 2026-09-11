// AI Rhyme, Doppelreim & Wordplay Engine
// Uses active LLM (Unsloth, Ollama, LM Studio, or hosted) to generate
// creative multi-syllable rhymes, slant assonances, street slang, and rhyming bars.

import { callChatLlm } from "./chat-client";
import { cacheGet, cacheSet, hashInputs } from "./cache";
import { countSyllables } from "./lyrics-analysis";
import { loadLlmConfig } from "./llm-config";

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

const PROMPT_TEMPLATE = `You are an elite hip-hop lyricist, battle rap ghostwriter, and phonetic rhyming architect.
Given the target word or line: "{WORD}"
{CONTEXT}

Generate creative, high-level hip-hop rhyming ideas across these 4 categories:
1. "multi": Multi-syllabic Doppelreim rhymes (2 to 4 syllables with matching vowel cadences).
2. "slant": Gritty hip-hop slant rhymes, assonance, and near-rhymes that flow naturally on beat.
3. "slang": Authentic street slang, cultural metaphors, or rap vocabulary that rhyme or resonate.
4. "bars": 3 punchy, cadence-locked rhyming punchline bars (ending with a rhyme for "{WORD}").

Output valid JSON only with this structure:
{
  "multi": [{"word": "string", "syllables": number}],
  "slant": [{"word": "string", "syllables": number}],
  "slang": [{"word": "string", "meaning": "short explanation"}],
  "bars": [{"word": "complete rhyming line with punch"}]
}
Return JSON only. No markdown, no commentary, no code fences.`;

export async function generateAiRhymes(
  targetWord: string,
  options: { context?: string; bypassCache?: boolean } = {}
): Promise<AiRhymeResult> {
  const cleanWord = targetWord.trim();
  if (!cleanWord) {
    return { query: "", groups: [], model: "" };
  }

  const config = loadLlmConfig();
  const contextStr = options.context ? `Surrounding lyrics/context:\n"${options.context}"` : "";

  const cacheKey = options.bypassCache
    ? ""
    : await hashInputs(["ai-rhymes", config.model, cleanWord, options.context ?? ""]);

  if (cacheKey) {
    const cached = await cacheGet<AiRhymeResult>("chat", cacheKey);
    if (cached) return cached;
  }

  const prompt = PROMPT_TEMPLATE.replace("{WORD}", cleanWord).replace("{CONTEXT}", contextStr);

  const raw = await callChatLlm({
    config,
    messages: [
      { role: "system", content: "You are an expert hip-hop rhyming dictionary. Output JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

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
          return { word: item, syllables: countSyllables(item), type };
        }
        if (item && typeof item === "object") {
          return {
            word: String(item.word || "").trim(),
            syllables: Number(item.syllables) || countSyllables(String(item.word || "")),
            type,
            meaning: item.meaning ? String(item.meaning) : undefined,
          };
        }
        return null;
      })
      .filter((i): i is AiRhymeItem => Boolean(i && i.word));
  };

  const groups: AiRhymeGroup[] = [
    {
      category: "multi",
      title: "Multi-Syllable (Doppelreim)",
      items: formatItems(parsed?.multi, "multi"),
    },
    {
      category: "slant",
      title: "Slant & Assonance",
      items: formatItems(parsed?.slant, "slant"),
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
  ].filter((g) => g.items.length > 0);

  const result: AiRhymeResult = {
    query: cleanWord,
    groups,
    model: config.model,
  };

  if (cacheKey && groups.length > 0) {
    await cacheSet("chat", cacheKey, result, { model: config.model });
  }

  return result;
}

export async function generateGhostwriteNextBars(
  currentLyrics: string,
  options: { count?: number; style?: string } = {}
): Promise<string[]> {
  const trimmed = currentLyrics.trim();
  if (!trimmed) return [];

  const config = loadLlmConfig();
  const count = options.count ?? 2;

  const prompt = `You are a platinum hip-hop ghostwriter.
Here are the current bars written by the artist:
"""
${trimmed}
"""

TASK: Write the NEXT ${count} bars that seamlessly continue the rhythm, cadence, and rhyme scheme.
RULES:
1. Must match the exact syllable count and vocal flow of the previous lines.
2. Form multi-syllabic end rhymes or punchlines with the preceding line.
3. Return ONLY the new bars, one per line. No quotes, no intro, no commentary.`;

  const raw = await callChatLlm({
    config,
    messages: [
      { role: "system", content: "You are a master rap lyricist. Return only the requested bars." },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 512,
  });

  return raw
    .split("\n")
    .map((l) => l.trim().replace(/^[-*#\d.]+\s*/, "").replace(/^["']|["']$/g, ""))
    .filter((l) => l.length > 3 && !/^(here are|verse|hook|bar \d)/i.test(l))
    .slice(0, count);
}

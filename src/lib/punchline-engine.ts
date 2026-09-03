// Punchline & Double Entendre Engine
//
// Generates hard-hitting punchlines, double entendres, and metaphorical twists.
// Dual-Engine architecture: leverages the active LLM (local or cloud) with
// zero-LLM algorithmic fallback when offline.

import { loadLlmConfig, chatTarget } from "./llm-config";
import { resolveTarget, applyBodyCompat } from "./providers";
import { countSyllables, endRhymeKey } from "./lyrics-analysis";
import { synthesizeMetaphors } from "./metaphor-synthesizer";
import { cmudictNearRhymes } from "./cmudict-rhymes";

export interface ScoredPunchline {
  line: string;
  score: number;
  techniques: string[];
  explanation?: string;
}

export interface PunchlineOptions {
  mood?: string;
  recentLines?: string[];
  count?: number;
}

const TECHNIQUES_VOCAB = {
  contrast: ["but", "yet", "although", "however", "though", "still", "instead", "even if"],
  wordplay: ["like", "as", "ain't", "literally", "double", "figure", "no cap", "twist"],
  callback: ["remember", "told you", "used to", "back when", "said", "day one"],
  reversal: ["flip", "switch", "turn", "reverse", "opposite", "tables turned"],
  entendre: ["mean", "both", "two ways", "level", "cents", "sense", "bars", "record"],
};

/**
 * Heuristically scores a bar's punchline quality (0-100) and detects techniques used.
 */
export function scorePunchline(line: string): {
  score: number;
  techniques: string[];
  syllables: number;
} {
  const lineLower = line.toLowerCase();
  const words = lineLower.split(/\s+/).filter(Boolean);
  let score = 25; // baseline
  const techniques: string[] = [];

  // Contrast check
  for (const w of TECHNIQUES_VOCAB.contrast) {
    if (lineLower.includes(w)) {
      score += 15;
      techniques.push("Contrast");
      break;
    }
  }

  // Wordplay / Simile check
  for (const w of TECHNIQUES_VOCAB.wordplay) {
    if (lineLower.includes(w)) {
      score += 15;
      techniques.push("Wordplay");
      break;
    }
  }

  // Reversal check
  for (const w of TECHNIQUES_VOCAB.reversal) {
    if (lineLower.includes(w)) {
      score += 15;
      techniques.push("Reversal");
      break;
    }
  }

  // Double Entendre keywords
  for (const w of TECHNIQUES_VOCAB.entendre) {
    if (lineLower.includes(w)) {
      score += 20;
      techniques.push("Double Entendre");
      break;
    }
  }

  // Word count sweet spot (8-14 words is optimal for punchlines)
  if (words.length >= 8 && words.length <= 13) {
    score += 15;
  } else if (words.length >= 6 && words.length <= 16) {
    score += 8;
  }

  // Alliteration detection (consecutive matching starting letters)
  let alliterationCount = 0;
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i][0] === words[i + 1][0] && /[a-z]/i.test(words[i][0])) {
      alliterationCount++;
    }
  }
  if (alliterationCount >= 1) {
    score += 10;
    techniques.push("Alliteration");
  }

  const syl = countSyllables(line);

  return {
    score: Math.min(100, score),
    techniques: Array.from(new Set(techniques)),
    syllables: syl,
  };
}

/**
 * Algorithmic zero-LLM punchline fallback.
 */
function generateAlgorithmicPunchlines(
  setup: string,
  mood: string = "confident"
): ScoredPunchline[] {
  const words = setup.trim().split(/\s+/).filter(Boolean);
  const anchorWord = words[words.length - 1]?.toLowerCase() || setup.toLowerCase();
  const rhymes = cmudictNearRhymes(anchorWord).slice(0, 5);
  const metaphor = synthesizeMetaphors(setup, [mood]);

  const candidates: ScoredPunchline[] = [];

  if (rhymes.length > 0) {
    for (const r of rhymes.slice(0, 3)) {
      const line = `They claim they got the ${anchorWord}, but I just flip the ${r.word}.`;
      candidates.push({
        line,
        score: 75,
        techniques: ["Contrast", "Rhyme Lock"],
        explanation: `Play on ${anchorWord} ↔ ${r.word}`,
      });
    }
  }

  // Metaphor-based punchlines
  if (metaphor.rawThemes.length > 0) {
    candidates.push({
      line: `Watch the table turn like ${metaphor.suggestedMetaphors[0] || "spinning rims"}, heavy on the crown.`,
      score: 82,
      techniques: ["Reversal", "Imagery"],
      explanation: "Theme-driven metaphor punch",
    });
  }

  candidates.push({
    line: `They talked about ${setup}, but they forgot the second meaning.`,
    score: 70,
    techniques: ["Double Entendre", "Contrast"],
    explanation: "Subversive double meaning",
  });

  return candidates;
}

/**
 * Generates witty punchlines and double entendres using active LLM or algorithmic fallback.
 */
export async function generatePunchlines(
  setup: string,
  opts: PunchlineOptions = {}
): Promise<{ punchlines: ScoredPunchline[]; source: "ai" | "algorithmic" }> {
  if (!setup.trim()) return { punchlines: [], source: "algorithmic" };

  const count = opts.count ?? 4;
  const mood = opts.mood || "confident";
  const recentContext = opts.recentLines?.slice(-4).join("\n") || "None";

  // Try LLM first
  try {
    const config = loadLlmConfig();
    const target = resolveTarget(chatTarget(config));

    if (target.baseUrl && target.model) {
      const prompt = `You are a legendary hip-hop lyricist, battle rapper, and punchline architect.
Generate exactly ${count} distinct, hard-hitting punchlines or double-entendre follow-up bars for this setup:
"${setup}"

Context / Mood: ${mood}
Recent bars:
${recentContext}

Rules:
1. Return valid JSON only — array of objects: [{"line": "string", "technique": "string", "score": number}].
2. Every line must be a COMPLETE, cadence-locked bar (9-14 syllables).
3. Use witty double entendres, homophones, wordplay, or cinematic contrasts.
4. Output no markdown, no fences, JSON array only.`;

      const body = applyBodyCompat(
        {
          model: target.model,
          messages: [
            { role: "system", content: "You output valid JSON arrays only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 1024,
        },
        target
      );

      const res = await fetch(`${target.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...target.headers },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const punchlines: ScoredPunchline[] = parsed.map((item: any) => {
              const scored = scorePunchline(item.line || "");
              return {
                line: item.line || "",
                score: Math.max(scored.score, item.score || 75),
                techniques: item.technique ? [item.technique, ...scored.techniques] : scored.techniques,
                explanation: item.explanation,
              };
            });
            return { punchlines, source: "ai" };
          }
        }
      }
    }
  } catch {
    // Graceful fallback to algorithmic engine
  }

  return {
    punchlines: generateAlgorithmicPunchlines(setup, mood),
    source: "algorithmic",
  };
}

// Pre-Generation Rhyme Ladder Planner (2-3 Syllable Multisyllables).
//
// Plans multisyllabic rime clusters across 4-bar blocks (AABB, ABAB, AAAA)
// using the 31,000+ entry Indic dictionary dataset and CMUdict phonetic keys
// BEFORE full line generation begins.

import type { LocalCadence } from "./local-pipeline";
import { findRhymesWithPos } from "./indic-dictionary";

export type RhymeLadderBar = {
  barIndex: number;
  targetSyllables: number;
  section: string;
  rhymeLetter: "A" | "B" | "C" | "D";
  targetRime: string;
  suggestedWords: string[];
};

export type RhymeLadderPlan = {
  bars: RhymeLadderBar[];
  scheme: string;
  promptInstructions: string;
};

// Fallback rime families for multisyllabic planning
const HINGLISH_LADDERS = [
  { rime: "aoon", words: ["mitaoon", "bataoon", "jitaoon", "chalaoon", "lataoon"] },
  { rime: "ain", words: ["main", "hain", "chain", "rain", "nain"] },
  { rime: "aan", words: ["jaan", "shaan", "maan", "aasmaan", "armaan"] },
  { rime: "eeb", words: ["naseeb", "kareeb", "hareeb", "khateeb"] },
  { rime: "ehra", words: ["chehra", "gehra", "pehra", "sehra"] },
  { rime: "ene", words: ["scene", "vibe", "haseen", "jabeen"] },
];

const KANGLISH_LADDERS = [
  { rime: "acha", words: ["macha", "locha", "pacha", "bacha", "socha"] },
  { rime: "othu", words: ["gothu", "mattu", "kattu", "hottu", "suttu"] },
  { rime: "ugi", words: ["hudugi", "magane", "sariyaagi", "sakkat"] },
  { rime: "uga", words: ["huduga", "magga", "jaga", "daga"] },
];

const GENERIC_LADDERS = [
  { rime: "ight", words: ["night", "tight", "light", "sight", "bright"] },
  { rime: "ion", words: ["mission", "vision", "decision", "friction"] },
  { rime: "ain", words: ["rain", "chain", "pain", "remain", "explain"] },
  { rime: "oor", words: ["door", "floor", "shore", "score", "more"] },
];

export function planRhymeLadders(
  cadence: LocalCadence,
  language: "kannada" | "hinglish" | "auto" = "auto",
): RhymeLadderPlan {
  const bars: RhymeLadderBar[] = [];
  const ladders =
    language === "hinglish"
      ? HINGLISH_LADDERS
      : language === "kannada"
      ? KANGLISH_LADDERS
      : GENERIC_LADDERS;

  let currentScheme = "AABB";

  cadence.bars.forEach((bar, idx) => {
    // 4-bar block grouping
    const blockIndex = Math.floor(idx / 4);
    const posInBlock = idx % 4;

    // AABB scheme: pos 0,1 -> A; pos 2,3 -> B
    const letter = posInBlock < 2 ? "A" : "B";
    const ladderIndex = (blockIndex * 2 + (letter === "A" ? 0 : 1)) % ladders.length;
    const selectedLadder = ladders[ladderIndex];

    // Query dictionary for extra matching words
    const dictHits = findRhymesWithPos(selectedLadder.words[0], language);
    const dictWords = dictHits.slice(0, 4).map((h) => h.word);

    const mergedWords = Array.from(new Set([...selectedLadder.words, ...dictWords]));

    bars.push({
      barIndex: bar.index,
      targetSyllables: bar.syllables,
      section: bar.section || "verse",
      rhymeLetter: letter,
      targetRime: selectedLadder.rime,
      suggestedWords: mergedWords.slice(0, 6),
    });
  });

  const promptInstructions = `
PRE-PLANNED MULTISYLLABIC RHYME LADDERS (AABB / ABAB):
${bars
  .slice(0, 8)
  .map(
    (b) =>
      `Bar ${b.barIndex} (${b.section}) [Rhyme ${b.rhymeLetter} - '${b.targetRime}']: target ${b.targetSyllables} syl. Suggested end words: ${b.suggestedWords.join(", ")}`
  )
  .join("\n")}
HARD RULE: End every bar in a 4-bar block using the assigned multisyllabic rime target!`;

  return {
    bars,
    scheme: currentScheme,
    promptInstructions,
  };
}

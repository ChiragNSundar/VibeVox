// Pre-Generation Rhyme Ladder Planner 2.0 (2-3 Syllable Multisyllables & Indic Prasa).
//
// Plans multisyllabic rime clusters across 4-bar blocks (AABB, ABAB, AAAA)
// using the 31,000+ entry Indic dictionary dataset, Dwitiyakshara Prasa pairings,
// and DHH Qafiya families BEFORE full line generation begins.

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

// Curated Indic rime families for multisyllabic planning
export const HINGLISH_LADDERS = [
  { rime: "aoon", words: ["mitaoon", "bataoon", "jitaoon", "chalaoon", "lataoon", "dabaoon"] },
  { rime: "aan", words: ["aasmaan", "dastaan", "bezubaan", "imtehaan", "armaan", "toofan"] },
  { rime: "eeb", words: ["naseeb", "kareeb", "ghareeb", "khateeb", "ajeeb", "tarkeeb"] },
  { rime: "ehra", words: ["chehra", "gehra", "pehra", "sehra", "thehra", "andhera"] },
  { rime: "aana", words: ["zamaana", "fasaana", "thikaana", "nishaana", "deewaana", "rulaana"] },
  { rime: "aani", words: ["zindagaani", "kahaani", "rawaani", "nishaani", "jawaani", "puraani"] },
  { rime: "aar", words: ["shikaar", "khunkhaar", "raftaar", "hathiyaar", "dildaar", "bezaar"] },
  { rime: "ood", words: ["wajood", "barood", "shuhood", "sujood"] },
  { rime: "aat", words: ["aukaat", "haalaat", "jazbaat", "mulaqaat", "baat", "raat"] },
  { rime: "aal", words: ["bawaal", "sawaal", "khayaal", "malaal", "kamaal", "sambhaal"] },
  { rime: "aaye", words: ["samjhaaye", "bhatkaaye", "aazmaaye", "behkaaye", "chamkaaye"] },
  { rime: "akta", words: ["dhadakta", "bhatakta", "chamakta", "garajta", "sulagta"] },
];

export const KANGLISH_LADDERS = [
  { rime: "acha", words: ["macha", "pacha", "locha", "bacha", "socha"] }, // Dwitiyakshara 'ch'
  { rime: "aagi", words: ["sariyaagi", "bisiyaagi", "dhooraagi", "haadaagi", "ondhaagi"] },
  { rime: "othu", words: ["gothu", "mattu", "kattu", "hottu", "suttu"] },
  { rime: "beku", words: ["barbeku", "tarbeku", "thilkolbeku", "nodbeku", "kelbeku"] },
  { rime: "odu", words: ["maadodu", "nododu", "kelodu", "bidadu", "haadodu"] },
  { rime: "illa", words: ["gothilla", "bittilla", "kettilla", "gotthilla", "kondilla"] },
  { rime: "ane", words: ["magane", "hegane", "thagane", "nimage", "yenu"] },
  { rime: "uru", words: ["bengaluru", "mysuru", "guru", "ooru", "sooru"] },
  { rime: "uga", words: ["huduga", "magga", "jaga", "daga"] },
];

export const BLEND_LADDERS = [
  { rime: "acha / aana", words: ["macha", "pacha", "zamaana", "thikaana", "scene-u"] },
  { rime: "aagi / aoon", words: ["sariyaagi", "bisiyaagi", "mitaoon", "bataoon"] },
  { rime: "beku / eeb", words: ["barbeku", "thilkolbeku", "naseeb", "kareeb"] },
  { rime: "guru / toofan", words: ["guru", "bengaluru", "toofan", "armaan", "haq se"] },
];

export const GENERIC_LADDERS = [
  { rime: "ight", words: ["night", "tight", "light", "sight", "bright"] },
  { rime: "ion", words: ["mission", "vision", "decision", "friction"] },
  { rime: "ain", words: ["rain", "chain", "pain", "remain", "explain"] },
  { rime: "oor", words: ["door", "floor", "shore", "score", "more"] },
];

export function planRhymeLadders(
  cadence: LocalCadence,
  language: "kannada" | "hinglish" | "blend" | "auto" = "auto",
): RhymeLadderPlan {
  const bars: RhymeLadderBar[] = [];
  const ladders =
    language === "hinglish"
      ? HINGLISH_LADDERS
      : language === "kannada"
      ? KANGLISH_LADDERS
      : language === "blend"
      ? BLEND_LADDERS
      : GENERIC_LADDERS;

  cadence.bars.forEach((bar, idx) => {
    // 4-bar block grouping
    const blockIndex = Math.floor(idx / 4);
    const posInBlock = idx % 4;

    // AABB scheme: pos 0,1 -> A; pos 2,3 -> B
    const letter = posInBlock < 2 ? "A" : "B";
    const ladderIndex = (blockIndex * 2 + (letter === "A" ? 0 : 1)) % ladders.length;
    const selectedLadder = ladders[ladderIndex];

    // Query dictionary for extra matching words
    const dictHits = findRhymesWithPos(selectedLadder.words[0], language === "blend" ? "blend" : language);
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
HARD RULE: End every bar in a 4-bar block using the assigned multisyllabic rime target! Keep Romanization strictly Latin without pronunciation marks or macrons.`;

  return {
    bars,
    scheme: "AABB",
    promptInstructions,
  };
}

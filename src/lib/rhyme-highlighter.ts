// Rhyme Highlighter & Phonetic Analysis Engine
// Ported from VibeLyrics with multi-tier Rhyme Vision, sub-word phoneme splitting,
// cross-line resonance, and Romanized Indic + English support.
// 100% pure TypeScript running in-browser with zero latency.

import { romanizeIndic } from "./indic-romanizer";
import { countSyllables } from "./lyrics-analysis";

export type RhymeVisionMode = "clean" | "standard" | "deep" | "all";

export type StanzaSchemeResult = {
  raw: string;           // e.g. "AABB"
  name: string;          // e.g. "AABB (Couplets)"
  lineLetters: string[]; // e.g. ["A", "A", "B", "B"]
  colors: string[];      // e.g. ["rhyme-group-1", "rhyme-group-1", "rhyme-group-2", "rhyme-group-2"]
};

export type HighlightedLineResult = {
  html: string;
  hasInternalRhyme: boolean;
  syllables: number;
  schemeLetter?: string;
  rhymeGroupClass?: string;
};

// 12 studio-curated harmonious rhyme palette names
export const RHYME_GROUP_CLASSES = [
  "rhyme-group-1",  // Warm Amber / Gold
  "rhyme-group-2",  // Cyan / Sky
  "rhyme-group-3",  // Crimson / Coral Red
  "rhyme-group-4",  // Electric Blue
  "rhyme-group-5",  // Emerald / Mint
  "rhyme-group-6",  // Sunset Orange
  "rhyme-group-7",  // Hot Pink / Fuchsia
  "rhyme-group-8",  // Lavender / Violet
  "rhyme-group-9",  // Flame Coral
  "rhyme-group-10", // Electric Lime
  "rhyme-group-11", // Turquoise
  "rhyme-group-12", // Honey Yellow
] as const;

export const NEAR_GROUP_CLASSES = [
  "near-group-1",
  "near-group-2",
  "near-group-3",
  "near-group-4",
  "near-group-5",
  "near-group-6",
] as const;

const ARPABET_VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY",
  "EH", "ER", "EY", "IH", "IY", "OW",
  "OY", "UH", "UW"
]);

// Rule-based grapheme-to-phoneme mappings for English syllables
const G2P_RULES: Array<[RegExp, string]> = [
  [/^tion$/, "SH AH N"],
  [/^sion$/, "ZH AH N"],
  [/^ight$/, "AY T"],
  [/^ite$/, "AY T"],
  [/^ound$/, "AW N D"],
  [/^own$/, "AW N"],
  [/^ame$/, "EY M"],
  [/^aim$/, "EY M"],
  [/^ake$/, "EY K"],
  [/^ace$/, "EY S"],
  [/^eak$/, "IY K"],
  [/^eek$/, "IY K"],
  [/^eam$/, "IY M"],
  [/^eem$/, "IY M"],
  [/^ore$/, "AO R"],
  [/^oor$/, "AO R"],
  [/^our$/, "AW ER"],
  [/^out$/, "AW T"],
  [/^all$/, "AO L"],
  [/^ell$/, "EH L"],
  [/^ill$/, "IH L"],
  [/^ull$/, "AH L"],
  [/^ink$/, "IH NG K"],
  [/^ank$/, "AE NG K"],
  [/^ack$/, "AE K"],
  [/^ick$/, "IH K"],
  [/^ock$/, "AA K"],
  [/^uck$/, "AH K"],
  [/^art$/, "AA R T"],
  [/^arm$/, "AA R M"],
  [/^air$/, "EH R"],
  [/^are$/, "EH R"],
  [/^ear$/, "IH R"],
];

/**
 * Extract phonetic representations for an English word.
 * Returns array of phoneme tokens, e.g. ["B", "OW1", "T"] or ["S", "K", "AA1", "R", "Z"].
 */
export function wordToPhones(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return [];

  // Check common hip-hop suffix patterns first
  for (const [re, phones] of G2P_RULES) {
    if (re.test(clean)) {
      return phones.split(" ");
    }
  }

  // Fallback G2P engine based on spelling heuristics
  const tokens: string[] = [];
  let i = 0;
  const len = clean.length;

  while (i < len) {
    const rem = clean.slice(i);

    // Multi-letter consonant graphemes
    if (rem.startsWith("ch")) { tokens.push("CH"); i += 2; continue; }
    if (rem.startsWith("sh")) { tokens.push("SH"); i += 2; continue; }
    if (rem.startsWith("th")) { tokens.push("TH"); i += 2; continue; }
    if (rem.startsWith("ph")) { tokens.push("F"); i += 2; continue; }
    if (rem.startsWith("wh")) { tokens.push("W"); i += 2; continue; }
    if (rem.startsWith("ck")) { tokens.push("K"); i += 2; continue; }
    if (rem.startsWith("ng")) { tokens.push("NG"); i += 2; continue; }

    // Multi-letter vowel graphemes
    if (rem.startsWith("igh")) { tokens.push("AY1"); i += 3; continue; }
    if (rem.startsWith("ight")) { tokens.push("AY1"); tokens.push("T"); i += 4; continue; }
    // Diphthong "ai" in words like "bhai", "lai", "shai" vs English "rain"
    if (rem.startsWith("ai")) {
      // In short or Indic words (e.g. bhai, lai, kai, thai), "ai" is AY1 ("eye")
      if (len <= 4 || i >= len - 2) {
        tokens.push("AY1");
      } else {
        tokens.push("EY1");
      }
      i += 2;
      continue;
    }
    if (rem.startsWith("ie")) {
      // At word end or short word (die, lie, tie, pie, untie), "ie" is AY1
      if (i + 2 === len || len <= 4) {
        tokens.push("AY1");
      } else {
        tokens.push("IY1");
      }
      i += 2;
      continue;
    }
    if (rem.startsWith("ee") || rem.startsWith("ea")) { tokens.push("IY1"); i += 2; continue; }
    if (rem.startsWith("oa") || rem.startsWith("oe")) { tokens.push("OW1"); i += 2; continue; }
    if (rem.startsWith("oo")) { tokens.push("UW1"); i += 2; continue; }
    if (rem.startsWith("ou") || rem.startsWith("ow")) { tokens.push("AW1"); i += 2; continue; }
    if (rem.startsWith("oi") || rem.startsWith("oy")) { tokens.push("OY1"); i += 2; continue; }
    if (rem.startsWith("ar")) { tokens.push("AA1"); tokens.push("R"); i += 2; continue; }
    if (rem.startsWith("er") || rem.startsWith("ir") || rem.startsWith("ur")) { tokens.push("ER1"); i += 2; continue; }
    if (rem.startsWith("or")) { tokens.push("AO1"); tokens.push("R"); i += 2; continue; }

    // Single vowels
    const c = clean[i];
    if (c === "a") {
      // Magic e check (e.g. game, late)
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("EY1");
      } else if (i === len - 1 && len > 1) {
        // Trailing unstressed 'a' in multisyllabic words (pasha, nasha, hogayela)
        tokens.push("AH0");
      } else {
        tokens.push("AE1");
      }
      i++;
      continue;
    }
    if (c === "e") {
      if (i === len - 1 && len > 2) {
        // In Indic words (e.g. bolte, kholte, sapne, apne, rahe, gale), trailing 'e' is vocalic (EY1/EH1)
        // Only silent in standard English words with single consonant before e (e.g. late, bite)
        const isIndicEnding = /[bcdfghjklmnpqrstvwxyz]{2,}$|[ltndkrsmpb]e$/.test(clean) && !/(?:ate|ite|ote|ake|ike|oke|ame|ime|ome|ave|ive|ove|ade|ide|ode)$/.test(clean);
        if (isIndicEnding) {
          tokens.push("EY1");
          i++;
          continue;
        } else if (clean[i - 1] !== "l") {
          // silent e at the end for English words
          i++;
          continue;
        }
      }
      tokens.push("EH1");
      i++;
      continue;
    }
    if (c === "i") {
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("AY1");
      } else if (rem.startsWith("ind") || rem.startsWith("ign") || rem.startsWith("ild")) {
        tokens.push("AY1");
      } else {
        tokens.push("IH1");
      }
      i++;
      continue;
    }
    if (c === "o") {
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("OW1");
      } else {
        tokens.push("OW1");
      }
      i++;
      continue;
    }
    if (c === "u") {
      tokens.push("AH1");
      i++;
      continue;
    }
    if (c === "y") {
      if (i === len - 1 && len > 1) {
        tokens.push("IY1");
      } else {
        tokens.push("Y");
      }
      i++;
      continue;
    }

    // Single consonants
    if (c === "c") {
      if (i + 1 < len && (clean[i + 1] === "e" || clean[i + 1] === "i" || clean[i + 1] === "y")) {
        tokens.push("S");
      } else {
        tokens.push("K");
      }
      i++;
      continue;
    }
    const upper = c.toUpperCase();
    tokens.push(upper);
    i++;
  }

  return tokens;
}

/**
 * Returns the rhyming part of phonemes (from the primary stressed vowel to end).
 * E.g. ["S", "K", "AA1", "R", "Z"] -> "AA1 R Z"
 * E.g. ["P", "AE1", "SH", "AH0"] -> "AE1 SH AH0" (asha)
 * E.g. ["N", "AE1", "SH", "AH0"] -> "AE1 SH AH0" (asha)
 */
export function getRhymingPart(phones: string[]): string {
  if (!phones.length) return "";

  // 1. Search for last stressed vowel (stress 1 or 2)
  let lastStressedIdx = -1;
  for (let i = phones.length - 1; i >= 0; i--) {
    const p = phones[i];
    if (/[12]$/.test(p)) {
      const base = p.replace(/\d/, "");
      if (ARPABET_VOWELS.has(base)) {
        lastStressedIdx = i;
        break;
      }
    }
  }

  if (lastStressedIdx !== -1) {
    return phones.slice(lastStressedIdx).join(" ");
  }

  // 2. If no stress digits, check if word has multiple vowels and ends in unstressed vowel
  const vowelIndices: number[] = [];
  for (let i = 0; i < phones.length; i++) {
    const base = phones[i].replace(/\d/, "");
    if (ARPABET_VOWELS.has(base)) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length >= 2) {
    const lastVowel = vowelIndices[vowelIndices.length - 1];
    if (lastVowel >= phones.length - 2) {
      // Feminine rhyme: start at penultimate vowel
      const penVowel = vowelIndices[vowelIndices.length - 2];
      return phones.slice(penVowel).join(" ");
    }
  }

  // 3. Fallback: last vowel to end
  if (vowelIndices.length > 0) {
    return phones.slice(vowelIndices[vowelIndices.length - 1]).join(" ");
  }

  return phones.slice(-2).join(" ");
}

/**
 * Weighted edit distance between two rhyming parts (rp1, rp2).
 * Vowel substitutions cost 0.5; consonant substitutions cost 1.0.
 * Near/slant rhymes have distance <= 1.0.
 */
export function phonemeDistance(rp1: string, rp2: string): number {
  if (!rp1 || !rp2) return 99;
  if (rp1 === rp2) return 0;

  const p1 = rp1.split(" ").map((p) => p.replace(/\d/, ""));
  const p2 = rp2.split(" ").map((p) => p.replace(/\d/, ""));

  const m = p1.length;
  const n = p2.length;
  if (Math.abs(m - n) > 2) return Math.abs(m - n);

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      let cost = 0;
      if (p1[i - 1] !== p2[j - 1]) {
        const v1 = ARPABET_VOWELS.has(p1[i - 1]);
        const v2 = ARPABET_VOWELS.has(p2[j - 1]);
        if (v1 && v2) cost = 0.5; // Vowel-vowel slant
        else if (!v1 && !v2) cost = 1.0; // Consonant-consonant slant
        else cost = 1.5;
      }
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Check if two phoneme strings form a multi-syllable rhyme.
 * True if they share 3+ trailing phonemes including at least one vowel.
 */
export function isMultiSyllableRhyme(phones1: string[], phones2: string[]): boolean {
  const p1 = phones1.map((p) => p.replace(/\d/, ""));
  const p2 = phones2.map((p) => p.replace(/\d/, ""));

  let matches = 0;
  let hasVowel = false;
  let i = p1.length - 1;
  let j = p2.length - 1;

  while (i >= 0 && j >= 0 && p1[i] === p2[j]) {
    matches++;
    if (ARPABET_VOWELS.has(p1[i])) hasVowel = true;
    i--;
    j--;
  }
  return matches >= 3 && hasVowel;
}

/**
 * Splits original word into [prefix, rhymeSuffix] for sub-word phoneme highlighting.
 * E.g. "scars" -> ["sc", "ars"], "boat" -> ["b", "oat"]
 */
export function splitWordAtRhyme(original: string, phones: string[], rhymePart: string): [string, string] {
  if (!original) return ["", original];
  const lower = original.toLowerCase();

  // For words with simple vowel match
  const vowels = "aeiouy";
  const rhymeTokens = rhymePart ? rhymePart.split(" ") : [];
  const onsetCount = Math.max(0, phones.length - rhymeTokens.length);

  if (onsetCount <= 0) {
    // Rhyme starts at beginning
    return ["", original];
  }

  // Count how many vowel phonemes exist in onset
  let onsetVowels = 0;
  for (let k = 0; k < onsetCount; k++) {
    if (ARPABET_VOWELS.has(phones[k].replace(/\d/, ""))) {
      onsetVowels++;
    }
  }

  // Find corresponding vowel index in original string
  let seenVowels = 0;
  let splitIdx = 0;
  for (let idx = 0; idx < lower.length; idx++) {
    if (vowels.includes(lower[idx])) {
      if (seenVowels === onsetVowels) {
        splitIdx = idx;
        break;
      }
      seenVowels++;
    }
  }

  if (splitIdx > 0 && splitIdx < original.length) {
    return [original.slice(0, splitIdx), original.slice(splitIdx)];
  }

  // Fallback: split at last vowel cluster
  const lastVowelMatch = lower.search(/[aeiouy][^aeiouy]*$/);
  if (lastVowelMatch > 0) {
    return [original.slice(0, lastVowelMatch), original.slice(lastVowelMatch)];
  }

  return ["", original];
}

/**
 * Check if a single line contains internal rhymes (rhymes between distinct words in the same line).
 */
export function detectInternalRhymes(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  const rps: string[] = [];
  const cleans: string[] = [];

  for (const w of words) {
    const clean = romanizeIndic(w).toLowerCase().replace(/[^a-z]/g, "");
    cleans.push(clean);
    if (!clean) {
      rps.push("");
      continue;
    }
    const phones = wordToPhones(clean);
    rps.push(getRhymingPart(phones));
  }

  for (let i = 0; i < rps.length; i++) {
    if (!rps[i]) continue;
    for (let j = i + 1; j < rps.length; j++) {
      if (rps[i] === rps[j] && cleans[i] !== cleans[j]) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Identifies 4-line stanza rhyme schemes (e.g. AABB, ABAB, AAAA, ABBA, XAXA).
 */
export function getStanzaRhymeScheme(lines: string[]): StanzaSchemeResult {
  if (!lines.length) {
    return { raw: "", name: "", lineLetters: [], colors: [] };
  }

  const targetLines = lines.slice(-4);
  const endings = targetLines.map((line) => {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const last = romanizeIndic(words[words.length - 1]).toLowerCase().replace(/[^a-z]/g, "");
    const phones = wordToPhones(last);
    return getRhymingPart(phones);
  });

  const scheme: string[] = [];
  const seen = new Map<string, string>();
  let currentCharCode = 65; // 'A'

  for (const end of endings) {
    if (!end) {
      scheme.push("X");
      continue;
    }

    let foundChar: string | null = null;
    for (const [knownEnd, char] of seen.entries()) {
      if (end === knownEnd || phonemeDistance(end, knownEnd) <= 1.0) {
        foundChar = char;
        break;
      }
    }

    if (foundChar) {
      scheme.push(foundChar);
    } else {
      const char = String.fromCharCode(currentCharCode++);
      scheme.push(char);
      seen.set(end, char);
    }
  }

  const rawPattern = scheme.join("");

  const patternNames: Record<string, string> = {
    AABB: "AABB (Couplets)",
    ABAB: "ABAB (Alternating)",
    AAAA: "AAAA (Monorhyme)",
    XAXA: "XAXA (Simple 4-Line)",
    ABBA: "ABBA (Enclosed)",
    AAXA: "AAXA (Triplet Lead)",
    AXAA: "AXAA (Triplet Drop)",
    AXXA: "AXXA (Envelope)",
  };

  const name = patternNames[rawPattern] || (rawPattern.length >= 4 ? rawPattern : "");

  // Assign consistent colors to letter symbols
  const letterToColor = new Map<string, string>();
  let colorIdx = 0;
  for (const char of scheme) {
    if (char !== "X" && !letterToColor.has(char)) {
      letterToColor.set(char, RHYME_GROUP_CLASSES[colorIdx % RHYME_GROUP_CLASSES.length]);
      colorIdx++;
    }
  }

  const colors = scheme.map((char) => letterToColor.get(char) || "rhyme-group-none");

  return {
    raw: rawPattern,
    name,
    lineLetters: scheme,
    colors,
  };
}

const COMMON_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "up", "about", "into", "over", "after", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "it", "its", "my", "your", "his", "her", "our", "their", "this",
  "that", "these", "those", "wh", "w", "all", "so", "as", "if"
]);

/**
 * Multi-layer rhyme highlighting engine.
 * Generates highlighted HTML strings for each line, decorated with
 * responsive CSS classes for the 12 rhyme families, slant rhymes, internal rhymes,
 * and multi-syllable glows.
 */
export function highlightLyrics(
  lines: string[],
  mode: RhymeVisionMode = "standard"
): HighlightedLineResult[] {
  if (!lines.length) return [];

  if (mode === "clean") {
    return lines.map((line) => ({
      html: line,
      hasInternalRhyme: false,
      syllables: countSyllables(line),
    }));
  }

  // 1. Tokenize lines into flat word list with coordinates
  type WordToken = {
    original: string;
    clean: string;
    lineIdx: number;
    wordIdx: number;
    phones: string[];
    rhymePart: string;
    isEndCandidate: boolean;
  };

  const allTokens: WordToken[] = [];
  const lineWordMap: number[][] = [];

  for (let l = 0; l < lines.length; l++) {
    const rawWords = lines[l].split(/\s+/).filter(Boolean);
    const lineIndices: number[] = [];

    for (let w = 0; w < rawWords.length; w++) {
      const orig = rawWords[w];
      const clean = romanizeIndic(orig).toLowerCase().replace(/[^a-z]/g, "");
      const phones = wordToPhones(clean);
      const rp = getRhymingPart(phones);

      // Only words near the end of the line are end-rhyme candidates
      // (Last word always; penultimate word only if non-stopword)
      const isLast = w === rawWords.length - 1;
      const isPenultimate = w === rawWords.length - 2;
      const isBracketTag = orig.startsWith("[") || orig.endsWith("]");
      const isEndCandidate =
        !isBracketTag &&
        ((isLast && (clean.length >= 2 || !COMMON_STOP_WORDS.has(clean))) ||
         (isPenultimate && clean.length >= 3 && !COMMON_STOP_WORDS.has(clean)));

      allTokens.push({
        original: orig,
        clean,
        lineIdx: l,
        wordIdx: w,
        phones,
        rhymePart: rp,
        isEndCandidate,
      });

      lineIndices.push(allTokens.length - 1);
    }
    lineWordMap.push(lineIndices);
  }

  const n = allTokens.length;
  if (n === 0) {
    return lines.map((line) => ({
      html: line,
      hasInternalRhyme: false,
      syllables: countSyllables(line),
    }));
  }

  // Decorators per word index
  const wordClasses: Set<string>[] = Array.from({ length: n }, () => new Set<string>());
  const wordSoundLabels: string[] = Array(n).fill("");
  const wordBadges: (string | undefined)[] = Array(n).fill(undefined);

  // 2. Classify tokens into Distinct Phonetic Signatures
  // We explicitly distinguish:
  // - Group 1: Long /aɪ/ Diphthong (die, homicide, hai, life) -> rhyme-group-1 (Warm Amber)
  // - Group 2: Nasal Long-I Compound /aɪnd/ (mind, grind) -> rhyme-group-2 (Sky Cyan)
  // - Group 3: Mid-Front /eɪ/ & /ɛ/ (pe, kare, bolte) -> rhyme-group-3 (Coral Red / Violet)
  // - Group 4: Short Central /ə/ & /ɑː/ (mera, na) -> rhyme-group-4 (Indigo / Emerald)
  // - Dynamic Groups: Other rime families (hogayela, pasha, etc.) -> rhyme-group-5..12

  type TokenPhoneticInfo = {
    familyKey: string;
    badge?: string;
    preferredColor?: string;
    isNasalCompound: boolean;
    vowel: string;
  };

  const tokenPhonetics: TokenPhoneticInfo[] = [];

  for (let i = 0; i < n; i++) {
    const tok = allTokens[i];
    const clean = tok.clean;
    const rp = tok.rhymePart;
    const phones = tok.phones;

    // Check Nasal Compound (/aɪnd/: mind, grind, find, blind, kind)
    if (clean.endsWith("ind") || rp === "AY1 N D" || rp.endsWith("AY1 N D")) {
      tokenPhonetics.push({
        familyKey: "family_nasal_ind",
        badge: "²",
        preferredColor: "rhyme-group-2",
        isNasalCompound: true,
        vowel: "AY",
      });
      continue;
    }

    // Extract stressed vowel
    let vBase = "";
    for (const p of phones) {
      const b = p.replace(/\d/, "");
      if (ARPABET_VOWELS.has(b)) {
        vBase = b;
      }
    }

    // Long /aɪ/ Diphthong (die, homicide, hai, life, ride, pride, etc.)
    const isAyFamily =
      vBase === "AY" ||
      clean.endsWith("ie") ||
      clean.endsWith("ide") ||
      clean.endsWith("ife") ||
      clean.endsWith("hai") ||
      clean.endsWith("ai") ||
      rp.includes("AY1");

    if (isAyFamily) {
      tokenPhonetics.push({
        familyKey: "family_ay_diphthong",
        badge: "¹",
        preferredColor: "rhyme-group-1",
        isNasalCompound: false,
        vowel: "AY",
      });
      continue;
    }

    // Mid-Front /eɪ/ & /ɛ/ (pe, kare, bolte, deke, leke, rahe)
    const isMidFront =
      vBase === "EY" ||
      vBase === "EH" ||
      clean === "pe" ||
      clean.endsWith("re") ||
      clean.endsWith("te") ||
      clean.endsWith("ke") ||
      clean.endsWith("le") ||
      rp.includes("EY1") ||
      rp.includes("EH1");

    if (isMidFront) {
      tokenPhonetics.push({
        familyKey: "family_mid_front",
        badge: "³",
        preferredColor: "rhyme-group-3",
        isNasalCompound: false,
        vowel: "EY",
      });
      continue;
    }

    // Short Central /ə/ & /ɑː/ (mera, na, tera, kya)
    const isCentralVowel =
      vBase === "AH" ||
      vBase === "AA" ||
      clean === "na" ||
      clean.endsWith("ra") ||
      clean.endsWith("ya") ||
      clean.endsWith("la") ||
      rp.includes("AH0") ||
      rp.includes("AA1");

    if (isCentralVowel) {
      tokenPhonetics.push({
        familyKey: "family_central_vowel",
        preferredColor: "rhyme-group-4",
        isNasalCompound: false,
        vowel: "AH",
      });
      continue;
    }

    // Generic / other rhyming parts (e.g. hogayela, pasha)
    tokenPhonetics.push({
      familyKey: rp || clean,
      isNasalCompound: false,
      vowel: vBase,
    });
  }

  // Group tokens by familyKey
  const familyClusters = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const tok = allTokens[i];
    if (COMMON_STOP_WORDS.has(tok.clean) && tok.clean !== "pe" && tok.clean !== "na") continue;
    const key = tokenPhonetics[i].familyKey;
    if (key) {
      const grp = familyClusters.get(key) || [];
      grp.push(i);
      familyClusters.set(key, grp);
    }
  }

  // Color mapping: assign curated hues for the 4 core groups,
  // and dynamically allocate rhyme-group-5..12 for others.
  const familyColors = new Map<string, string>();
  familyColors.set("family_ay_diphthong", "rhyme-group-1"); // Warm Amber
  familyColors.set("family_nasal_ind", "rhyme-group-2");   // Sky Cyan
  familyColors.set("family_mid_front", "rhyme-group-3");   // Coral / Violet
  familyColors.set("family_central_vowel", "rhyme-group-4"); // Indigo / Emerald

  let dynColorIdx = 4; // starts at rhyme-group-5
  for (const [key, indices] of familyClusters.entries()) {
    if (indices.length < 2) continue;
    if (!familyColors.has(key)) {
      familyColors.set(key, RHYME_GROUP_CLASSES[dynColorIdx % RHYME_GROUP_CLASSES.length]);
      dynColorIdx++;
    }
  }

  // Apply colors & decorators to matched tokens
  for (const [key, indices] of familyClusters.entries()) {
    if (indices.length < 2) continue;
    const css = familyColors.get(key) || "rhyme-group-1";

    for (const idx of indices) {
      wordClasses[idx].add(css);
      wordClasses[idx].add("rhyme-word");
      wordSoundLabels[idx] = allTokens[idx].rhymePart;

      // Assign semantic layer badges
      if (key === "family_nasal_ind") {
        wordBadges[idx] = "²";
      } else if (key === "family_mid_front") {
        wordBadges[idx] = "³";
      }
    }
  }

  // 3. Mosaic / Multisyllabic Compound Cadence Engine (do or die ⇄ homicide)
  // Check cross-line end-candidates in the /aɪ/ family
  const ayEndCandidates = allTokens
    .map((tok, idx) => ({ tok, idx }))
    .filter(({ tok, idx }) => tok.isEndCandidate && tokenPhonetics[idx].familyKey === "family_ay_diphthong");

  if (ayEndCandidates.length >= 2) {
    // Find the multisyllabic target (e.g. homicide: 3 syllables)
    const maxSyl = Math.max(
      ...ayEndCandidates.map(
        ({ tok }) => tok.phones.filter((p) => ARPABET_VOWELS.has(p.replace(/\d/, ""))).length || 1
      )
    );

    for (const { tok, idx } of ayEndCandidates) {
      wordClasses[idx].add("mosaic-cadence");
      wordClasses[idx].add("multi-syl-rhyme");
      wordBadges[idx] = "¹";

      const tokSyl = tok.phones.filter((p) => ARPABET_VOWELS.has(p.replace(/\d/, ""))).length || 1;
      let needed = maxSyl - tokSyl;

      if (needed > 0) {
        const lineIndices = lineWordMap[tok.lineIdx];
        const pos = lineIndices.indexOf(idx);

        // Link preceding words in line into mosaic cadence (e.g. 'do', 'or')
        for (let p = pos - 1; p >= 0 && needed > 0; p--) {
          const prevIdx = lineIndices[p];
          const prevTok = allTokens[prevIdx];
          const prevSyl = prevTok.phones.filter((ph) => ARPABET_VOWELS.has(ph.replace(/\d/, ""))).length || 1;

          wordClasses[prevIdx].add("rhyme-group-1");
          wordClasses[prevIdx].add("rhyme-word");
          wordClasses[prevIdx].add("mosaic-cadence");
          needed -= prevSyl;
        }
      }
    }
  }

  // 5. Internal rhymes (within-line pairs, non-stop words only)
  const lineHasInternalRhyme: boolean[] = Array(lines.length).fill(false);
  for (let l = 0; l < lines.length; l++) {
    const wordIndices = lineWordMap[l];
    if (wordIndices.length < 2) continue;

    for (let a = 0; a < wordIndices.length; a++) {
      for (let b = a + 1; b < wordIndices.length; b++) {
        const idxA = wordIndices[a];
        const idxB = wordIndices[b];
        const tokA = allTokens[idxA];
        const tokB = allTokens[idxB];

        if (COMMON_STOP_WORDS.has(tokA.clean) || COMMON_STOP_WORDS.has(tokB.clean)) continue;
        if (tokA.clean.length < 3 || tokB.clean.length < 3) continue;
        if (tokA.original.startsWith("[") || tokB.original.startsWith("[")) continue;

        if (tokA.rhymePart && tokA.rhymePart === tokB.rhymePart && tokA.clean !== tokB.clean) {
          lineHasInternalRhyme[l] = true;
          if (mode === "deep" || mode === "all") {
            wordClasses[idxA].add("internal-rhyme");
            wordClasses[idxB].add("internal-rhyme");
          }
        }
      }
    }
  }

  // 6. Stanza rhyme scheme calculation
  const stanzaScheme = getStanzaRhymeScheme(lines);

  // 7. Render decorated HTML with sub-word phoneme spans and hover attributes
  const results: HighlightedLineResult[] = [];

  for (let l = 0; l < lines.length; l++) {
    const wordIndices = lineWordMap[l];
    if (!wordIndices.length) {
      results.push({
        html: lines[l],
        hasInternalRhyme: false,
        syllables: 0,
      });
      continue;
    }

    const htmlParts: string[] = [];
    let lineGroupClass: string | undefined;

    for (const idx of wordIndices) {
      const tok = allTokens[idx];
      const classes = wordClasses[idx];

      if (!classes.size) {
        // Plain word wrapped in .word-hover for click/hover interactions
        htmlParts.push(
          `<span class="word-hover" data-word="${tok.clean}">${tok.original}</span>`
        );
        continue;
      }

      const clsStr = Array.from(classes).sort().join(" ");
      const soundAttr = wordSoundLabels[idx] ? ` data-sound="${wordSoundLabels[idx]}"` : "";

      // Capture line group class from the final word of the line if it has a rhyme group
      if (idx === wordIndices[wordIndices.length - 1]) {
        for (const cls of classes) {
          if (cls.startsWith("rhyme-group-")) lineGroupClass = cls;
        }
      }

      const badge = wordBadges[idx] ? `<sup class="mosaic-badge">${wordBadges[idx]}</sup>` : "";

      // Sub-word phoneme split
      if (classes.has("rhyme-word") || classes.has("near-rhyme")) {
        const [prefix, suffix] = splitWordAtRhyme(tok.original, tok.phones, tok.rhymePart);
        if (prefix && suffix) {
          htmlParts.push(
            `<span class="word-hover" data-word="${tok.clean}">${prefix}<span class="${clsStr}"${soundAttr}>${suffix}</span>${badge}</span>`
          );
        } else {
          htmlParts.push(
            `<span class="word-hover ${clsStr}" data-word="${tok.clean}"${soundAttr}>${tok.original}${badge}</span>`
          );
        }
      } else {
        htmlParts.push(
          `<span class="word-hover ${clsStr}" data-word="${tok.clean}"${soundAttr}>${tok.original}${badge}</span>`
        );
      }
    }

    // Determine scheme letter for this line if available
    const targetLinesCount = Math.min(4, lines.length);
    const lineFromEnd = lines.length - 1 - l;
    const stanzaIdx = targetLinesCount - 1 - lineFromEnd;
    const schemeLetter = stanzaIdx >= 0 && stanzaIdx < stanzaScheme.lineLetters.length ? stanzaScheme.lineLetters[stanzaIdx] : undefined;

    results.push({
      html: htmlParts.join(" "),
      hasInternalRhyme: lineHasInternalRhyme[l],
      syllables: countSyllables(lines[l]),
      schemeLetter: schemeLetter !== "X" ? schemeLetter : undefined,
      rhymeGroupClass: lineGroupClass,
    });
  }

  return results;
}

export interface FlowInsight {
  lineIdx: number;
  hangingWord: string;
  hangingSound: string;
  endWord: string;
  mosaicPattern: string;
  title: string;
  message: string;
  suggestions: string[];
}

/**
 * Detects broken rhyme chains and missing multi-syllable links (e.g. primary /aɪ/ left hanging mid-bar).
 */
export function detectFlowInsight(lines: string[]): FlowInsight | null {
  if (lines.length < 3) return null;

  const line0 = lines[0].toLowerCase();
  const line1 = lines[1].toLowerCase();
  const line2 = lines[2].toLowerCase();

  const l0HasAy = line0.endsWith("die") || line0.includes("or die") || line0.includes("do or die");
  const l1HasAy = line1.endsWith("cide") || line1.endsWith("homicide") || line1.endsWith("suicide");

  if (l0HasAy && l1HasAy) {
    const words2 = line2.trim().split(/\s+/);
    const lastWord = words2[words2.length - 1]?.replace(/[^a-z]/g, "");

    const midWords = words2.slice(0, -1).map((w) => w.replace(/[^a-z]/g, ""));
    const hangingWord = midWords.find((w) => w === "life" || w === "die" || w === "ride" || w === "mine");

    if (hangingWord && lastWord && !["die", "cide", "ride", "wide", "side", "compromise"].some((e) => lastWord.endsWith(e))) {
      return {
        lineIdx: 2,
        hangingWord,
        hangingSound: "Long /aɪ/ Diphthong",
        endWord: lastWord,
        mosaicPattern: "do or die (/duː ɔːr daɪ/) ⇄ hom-i-cide (/hɒ mɪ saɪd/)",
        title: "Flow Architecture: Complete the 3-Syllable Mosaic",
        message: `Line 3 currently leaves the primary /aɪ/ rhyme hanging on '${hangingWord}' and ends on '${lastWord}'. To turn this into a textbook complex multi, match Line 3's final 3 syllables:`,
        suggestions: [
          "grind pe na compromise (/kɒm prə maɪz/)",
          "grind pe na slow down ride",
          "grind pe na life jaaye (/laɪf dʒaː eɪ/)",
        ],
      };
    }
  }

  return null;
}

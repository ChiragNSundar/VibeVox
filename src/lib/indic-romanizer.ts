// Indic Romanizer & Transliteration Engine for Kanglish & Hinglish.
// Converts native Kannada and Devanagari scripts into natural colloquial Romanized text,
// and strips all diacritical pronunciation marks (IAST/dictionary accents, macrons, dots).
// Designed for Desi hip-hop, street rap, and phonetic lyric writing.

// ---------------------------------------------------------------------------
// 1. Diacritics & Pronunciation Mark Stripper
// ---------------------------------------------------------------------------

const DIACRITIC_MAP: Record<string, string> = {
  // Long vowels (macrons)
  ā: "a",
  Ā: "A",
  ī: "ee",
  Ī: "Ee",
  ū: "oo",
  Ū: "Oo",
  ē: "e",
  Ē: "E",
  ō: "o",
  Ō: "O",

  // Vocalic R / L
  ṛ: "ri",
  Ṛ: "Ri",
  ṝ: "ri",
  Ṝ: "Ri",
  ḷ: "l",
  Ḷ: "L",
  ḹ: "l",
  Ḹ: "L",

  // Nasals
  ṃ: "m",
  Ṃ: "M",
  ṁ: "m",
  Ṁ: "M",
  ṅ: "n",
  Ṅ: "N",
  ñ: "n",
  Ñ: "N",
  ṇ: "n",
  Ṇ: "N",

  // Retroflexes
  ṭ: "t",
  Ṭ: "T",
  ḍ: "d",
  Ḍ: "D",

  // Sibilants
  ś: "sh",
  Ś: "Sh",
  ṣ: "sh",
  Ṣ: "Sh",
  š: "sh",
  Š: "Sh",
  č: "ch",
  Č: "Ch",
  ž: "z",
  Ž: "Z",

  // Visarga / aspiration
  ḥ: "h",
  Ḥ: "H",

  // Dictionary phonetic symbols / accents
  ú: "u",
  û: "u",
  ű: "",
  ȧ: "a",
  ȥ: "",
  ᶃ: "",
  ᶄ: "",
  ᶁ: "",
  á: "a",
  à: "a",
  é: "e",
  è: "e",
  í: "i",
  ì: "i",
  ó: "o",
  ò: "o",
};

/**
 * Remove all IAST diacritical accents, macrons, and dictionary pronunciation symbols.
 * Returns clean, natural Roman script (English alphabet only).
 */
export function stripPronunciationMarks(text: string): string {
  if (!text) return "";

  // 1. Replace mapped special multi-character substitutions (e.g. ś -> sh, ṛ -> ri)
  let s = text.replace(
    /[āĀīĪūŪēĒōŌṛṚṝṜḷḶḹḸṃṂṁṀṅṄñÑṇṆṭṬḍḌśŚṣṢšŠčČžŽḥḤúûűȧȥᶃᶄᶁáàéèíìóò]/g,
    (ch) => DIACRITIC_MAP[ch] ?? ch,
  );

  // 2. Normalize NFD to separate any remaining combining diacritical marks and strip them
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Clean up dictionary punctuation artifacts: 〈 〉, extra quotes
  s = s.replace(/[〈〉]/g, "");

  return s;
}

// ---------------------------------------------------------------------------
// 2. Native Kannada Script -> Kanglish
// ---------------------------------------------------------------------------

const KANNADA_INDEPENDENT_VOWELS: Record<number, string> = {
  0x0c85: "a",
  0x0c86: "aa",
  0x0c87: "i",
  0x0c88: "ee",
  0x0c89: "u",
  0x0c8a: "oo",
  0x0c8b: "ru",
  0x0c8e: "e",
  0x0c8f: "e",
  0x0c90: "ai",
  0x0c92: "o",
  0x0c93: "o",
  0x0c94: "au",
};

const KANNADA_MATRAS: Record<number, string> = {
  0x0cbe: "aa",
  0x0cbf: "i",
  0x0cc0: "ee",
  0x0cc1: "u",
  0x0cc2: "u", // standard Kanglish writes 'u' (e.g. bengaluru, beku)
  0x0cc3: "ru",
  0x0cc6: "e",
  0x0cc7: "e",
  0x0cc8: "ai",
  0x0cca: "o",
  0x0ccb: "o",
  0x0ccc: "au",
};

const KANNADA_CONSONANTS: Record<number, string> = {
  0x0c95: "k",
  0x0c96: "kh",
  0x0c97: "g",
  0x0c98: "gh",
  0x0c99: "ng",
  0x0c9a: "ch",
  0x0c9b: "chh",
  0x0c9c: "j",
  0x0c9d: "jh",
  0x0c9e: "ny",
  0x0c9f: "t",
  0x0ca0: "th",
  0x0ca1: "d",
  0x0ca2: "dh",
  0x0ca3: "n",
  0x0ca4: "t",
  0x0ca5: "th",
  0x0ca6: "d",
  0x0ca7: "dh",
  0x0ca8: "n",
  0x0caa: "p",
  0x0cab: "ph",
  0x0cac: "b",
  0x0cad: "bh",
  0x0cae: "m",
  0x0caf: "y",
  0x0cb0: "r",
  0x0cb1: "r",
  0x0cb2: "l",
  0x0cb5: "v",
  0x0cb6: "sh",
  0x0cb7: "sh",
  0x0cb8: "s",
  0x0cb9: "h",
  0x0cb3: "l", // LLA ಳ
};

const KANNADA_VIRAMA = 0x0ccd; // ್
const KANNADA_ANUSVARA = 0x0c82; // ಂ
const KANNADA_VISARGA = 0x0c83; // ಃ

export function kannadaToKanglish(text: string): string {
  let out = "";
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // Independent Vowel
    if (KANNADA_INDEPENDENT_VOWELS[code]) {
      out += KANNADA_INDEPENDENT_VOWELS[code];
      continue;
    }

    // Consonant
    if (KANNADA_CONSONANTS[code]) {
      const baseConsonant = KANNADA_CONSONANTS[code];
      const nextCode = i + 1 < len ? text.charCodeAt(i + 1) : 0;
      const nextNextCode = i + 2 < len ? text.charCodeAt(i + 2) : 0;

      if (nextCode === KANNADA_VIRAMA) {
        // Halant suppresses inherent 'a'
        out += baseConsonant;
        i++; // skip virama
      } else if (KANNADA_MATRAS[nextCode]) {
        let matra = KANNADA_MATRAS[nextCode];
        // Suffix -iya: if ೀ is followed by ಯ, use 'i' (e.g. hegiddiya, nodidiya)
        if (nextCode === 0x0cc0 && nextNextCode === 0x0caf) {
          matra = "i";
        }
        out += baseConsonant + matra;
        i++; // skip matra
      } else {
        // Inherent vowel 'a'
        out += baseConsonant + "a";
      }
      continue;
    }

    // Anusvara
    if (code === KANNADA_ANUSVARA) {
      // Look ahead: if next is p, b, m -> use 'm', else 'n'
      const nextCode = i + 1 < len ? text.charCodeAt(i + 1) : 0;
      if (nextCode >= 0x0caa && nextCode <= 0x0cae) {
        out += "m";
      } else {
        out += "n";
      }
      continue;
    }

    // Visarga
    if (code === KANNADA_VISARGA) {
      out += "h";
      continue;
    }

    // Pass through all other chars (spaces, punctuation, latin)
    out += text[i];
  }

  return out;
}

// ---------------------------------------------------------------------------
// 3. Native Devanagari Script -> Hinglish
// ---------------------------------------------------------------------------

const DEVANAGARI_INDEPENDENT_VOWELS: Record<number, string> = {
  0x0904: "a",
  0x0905: "a",
  0x0906: "aa",
  0x0907: "i",
  0x0908: "ee",
  0x0909: "u",
  0x090a: "oo",
  0x090b: "ri",
  0x090e: "e",
  0x090f: "e",
  0x0910: "ai",
  0x0911: "o",
  0x0912: "o",
  0x0913: "o",
  0x0914: "au",
};

const DEVANAGARI_MATRAS: Record<number, string> = {
  0x093e: "aa",
  0x093f: "i",
  0x0940: "i", // colloquial Hinglish prefers -i (zindagi, dosti)
  0x0941: "u",
  0x0942: "oo",
  0x0943: "ri",
  0x0947: "e",
  0x0948: "ai",
  0x094b: "o",
  0x094c: "au",
};

const DEVANAGARI_CONSONANTS: Record<number, string> = {
  0x0915: "k",
  0x0916: "kh",
  0x0917: "g",
  0x0918: "gh",
  0x0919: "ng",
  0x091a: "ch",
  0x091b: "chh",
  0x091c: "j",
  0x091d: "jh",
  0x091e: "ny",
  0x091f: "t",
  0x0920: "th",
  0x0921: "d",
  0x0922: "dh",
  0x0923: "n",
  0x0924: "t",
  0x0925: "th",
  0x0926: "d",
  0x0927: "dh",
  0x0928: "n",
  0x092a: "p",
  0x092b: "ph",
  0x092c: "b",
  0x092d: "bh",
  0x092e: "m",
  0x092f: "y",
  0x0930: "r",
  0x0931: "r",
  0x0932: "l",
  0x0933: "l",
  0x0935: "v",
  0x0936: "sh",
  0x0937: "sh",
  0x0938: "s",
  0x0939: "h",

  // Nukta consonants (Urdu/Hindustani loan sounds common in rap)
  0x0958: "q",
  0x0959: "kh",
  0x095a: "gh",
  0x095b: "z",
  0x095c: "d",
  0x095d: "dh",
  0x095e: "f",
  0x095f: "y",
};

const DEVANAGARI_VIRAMA = 0x094d; // ्
const DEVANAGARI_ANUSVARA = 0x0902; // ं
const DEVANAGARI_CHANDRABINDU = 0x0901; // ँ
const DEVANAGARI_VISARGA = 0x0903; // ः
const DEVANAGARI_NUKTA = 0x093c; // ़

export function devanagariToHinglish(text: string): string {
  let out = "";
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // Independent Vowel
    if (DEVANAGARI_INDEPENDENT_VOWELS[code]) {
      let v = DEVANAGARI_INDEPENDENT_VOWELS[code];
      // When 'ए' follows a vowel, it is pronounced and written 'ye' (e.g. aayega, jaayenge)
      if (code === 0x090f && out.length > 0 && /[aeiou]$/i.test(out)) {
        v = "ye";
      }
      // When 'ई' follows a vowel, write 'i' (e.g. bhai, gayi)
      if (code === 0x0908 && out.length > 0 && /[aeiou]$/i.test(out)) {
        v = "i";
      }
      out += v;
      continue;
    }

    // Consonant
    if (DEVANAGARI_CONSONANTS[code]) {
      let baseConsonant = DEVANAGARI_CONSONANTS[code];
      let offset = 1;

      // Check for Nukta directly following consonant
      if (i + 1 < len && text.charCodeAt(i + 1) === DEVANAGARI_NUKTA) {
        if (code === 0x0915) baseConsonant = "q";
        else if (code === 0x0916) baseConsonant = "kh";
        else if (code === 0x0917) baseConsonant = "gh";
        else if (code === 0x091c) baseConsonant = "z";
        else if (code === 0x092b) baseConsonant = "f";
        else if (code === 0x0921) baseConsonant = "d";
        else if (code === 0x0922) baseConsonant = "dh";
        offset++;
      }

      const nextCode = i + offset < len ? text.charCodeAt(i + offset) : 0;
      const followingConsonant = i + offset < len && DEVANAGARI_CONSONANTS[nextCode];
      const nextNextCode = i + offset + 1 < len ? text.charCodeAt(i + offset + 1) : 0;
      const nextHasMatra = nextNextCode && DEVANAGARI_MATRAS[nextNextCode];

      if (nextCode === DEVANAGARI_VIRAMA) {
        out += baseConsonant;
        i += offset; // skip virama
      } else if (DEVANAGARI_MATRAS[nextCode]) {
        let matra = DEVANAGARI_MATRAS[nextCode];
        // Word-final matra 'aa' (0x093E) is colloquially written '-a' (e.g. apna, raja, mera, chalega)
        const afterMatra = i + offset + 1 < len ? text.charCodeAt(i + offset + 1) : 0;
        const isMatraWordEnd =
          i + offset + 1 >= len ||
          afterMatra === 32 ||
          (afterMatra >= 33 && afterMatra <= 64);
        if (nextCode === 0x093e && isMatraWordEnd) {
          matra = "a";
        }
        out += baseConsonant + matra;
        i += offset; // skip matra
      } else {
        // Inherent 'a'
        const followingCode = i + offset < len ? text.charCodeAt(i + offset) : 0;
        const isWordEnd =
          i + offset >= len ||
          followingCode === 32 ||
          (followingCode >= 33 && followingCode <= 64);

        // Hindi Medial Schwa Deletion:
        // When preceded by a vowel (e.g. 'a' in 'apna', 'ka' in 'karna') and
        // followed by a consonant that has an attached matra (like 'na' in 'apna', 'na' in 'karna'),
        // the medial inherent 'a' is dropped!
        const isMedialSchwaDrop =
          out.length > 0 &&
          /[aeiou]$/i.test(out) &&
          followingConsonant &&
          nextHasMatra;

        if ((isWordEnd && out.length > 0) || isMedialSchwaDrop) {
          out += baseConsonant;
        } else {
          out += baseConsonant + "a";
        }
      }
      continue;
    }

    // Anusvara or Chandrabindu
    if (code === DEVANAGARI_ANUSVARA || code === DEVANAGARI_CHANDRABINDU) {
      const nextCode = i + 1 < len ? text.charCodeAt(i + 1) : 0;
      if (nextCode >= 0x092a && nextCode <= 0x092e) {
        out += "m";
      } else {
        out += "n";
      }
      continue;
    }

    // Visarga
    if (code === DEVANAGARI_VISARGA) {
      out += "h";
      continue;
    }

    out += text[i];
  }

  return out;
}

// ---------------------------------------------------------------------------
// 4. Unified Romanizer
// ---------------------------------------------------------------------------

/** True if the text contains any Kannada script characters */
export function hasKannadaScript(text: string): boolean {
  return /[\u0C80-\u0CFF]/.test(text);
}

/** True if the text contains any Devanagari script characters */
export function hasDevanagariScript(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/** True if the text contains either Kannada or Devanagari characters */
export function hasIndicScript(text: string): boolean {
  return /[\u0C80-\u0CFF\u0900-\u097F]/.test(text);
}

/**
 * Romanizes any text containing Kannada or Devanagari scripts,
 * and strips all pronunciation marks / diacritical accents.
 * Output is pure, colloquial Latin alphabet text (Kanglish, Hinglish, English).
 */
export function romanizeIndic(text: string): string {
  if (!text) return "";

  let res = text;

  // 1. Kannada -> Kanglish
  if (hasKannadaScript(res)) {
    res = kannadaToKanglish(res);
  }

  // 2. Devanagari -> Hinglish
  if (hasDevanagariScript(res)) {
    res = devanagariToHinglish(res);
  }

  // 3. Strip all diacritics and pronunciation marks
  res = stripPronunciationMarks(res);

  return res;
}

/**
 * Normalizes an Indic or English word for rhyme matching and indexing:
 * lowercase, romanized, stripped of pronunciation marks, non-alphanumeric removed.
 */
export function normalizeIndicWord(word: string): string {
  const romanized = romanizeIndic(word);
  return romanized.toLowerCase().replace(/[^a-z0-9]/g, "");
}

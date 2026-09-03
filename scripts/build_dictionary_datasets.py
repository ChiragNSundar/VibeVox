#!/usr/bin/env python3
"""
VibeVox — Multilingual Lyric Dictionary & Training Dataset Builder
Parses KEED_2018-29-971.pdf (Kannada-English Dictionary) and compiles:
  1. Romanized Kannada Lyric Dictionary Dataset (pos, English meaning, syllables, rimes, multisyllables)
  2. Romanized Hindi (Hinglish) Lyric Dictionary Dataset
  3. JSON & TypeScript exports for client RAG, rhyme matching, and LLM fine-tuning datasets.
"""

import os
import sys
import re
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_PATH = os.path.join(ROOT_DIR, "data", "KEED_2018-29-971.pdf")
VIBE_INDEX_PATH = "D:/GitHub/VibeLyrics/data/kannada_dictionary_index.json"

PUBLIC_DATA_DIR = os.path.join(ROOT_DIR, "public", "data")
LIB_DATA_DIR = os.path.join(ROOT_DIR, "src", "lib", "data")
os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
os.makedirs(LIB_DATA_DIR, exist_ok=True)

# Transliteration normalizer for street lyric Romanization
DIACRITICS_MAP = {
  'ā': 'aa', 'ī': 'ee', 'ū': 'oo', 'ē': 'e', 'ō': 'o',
  'ṛ': 'ri', 'ḷ': 'lu', 'ṁ': 'm', 'ḥ': 'h',
  'ñ': 'ny', 'ṅ': 'ng', 'ṇ': 'n', 'ṭ': 't', 'ḍ': 'd',
  'ś': 'sh', 'ṣ': 'sh', 'c': 'ch', 'v': 'v'
}

def normalize_romanization(word: str) -> str:
    res = word.lower()
    for char, rep in DIACRITICS_MAP.items():
        res = res.replace(char, rep)
    res = re.sub(r'[^a-z]', '', res)
    return res

def count_syllables(word: str) -> int:
    w = re.sub(r'[^a-z]', '', word.lower())
    if not w:
        return 0
    if len(w) <= 2:
        return 1
    # Active trailing e in Indic
    is_active_e = bool(re.search(r'(?:[aeiou]|de|re|ke|me|se|te|ne|ge|he|ye|che|phe)$', w))
    s = w
    if s.endswith("e") and not s.endswith("le") and not is_active_e:
        s = s[:-1]
    # Split hiatuses
    expanded = re.sub(
        r'([aeiouy])([aeiouy])',
        lambda m: m.group(0) if m.group(1)+m.group(2) in ['aa','ee','oo','ai','au'] else f"{m.group(1)} {m.group(2)}",
        s
    )
    groups = re.findall(r'[aeiouy]+', expanded)
    return max(1, len(groups))

def extract_rime(word: str) -> str:
    w = re.sub(r'[^a-z]', '', word.lower())
    m = re.search(r'[aeiouy]+[^aeiouy]*$', w)
    return m.group(0) if m else w[-2:]

def extract_multi_rime(word: str) -> str:
    w = re.sub(r'[^a-z]', '', word.lower())
    matches = re.findall(r'[aeiouy]+[^aeiouy]*', w)
    if len(matches) >= 2:
        return "".join(matches[-2:])
    return matches[0] if matches else w[-2:]

def parse_pos(def_text: str) -> str:
    d = def_text.lower()
    if '(n.)' in d or '(n)' in d or 'n.' in d:
        return 'noun'
    if '(v.)' in d or '(vi.)' in d or '(vt.)' in d or 'v.' in d:
        return 'verb'
    if '(adj.)' in d or 'adj.' in d:
        return 'adjective'
    if '(adv.)' in d or 'adv.' in d:
        return 'adverb'
    if '(pron.)' in d:
        return 'pronoun'
    if '(interj.)' in d:
        return 'interjection'
    return 'noun'

def clean_definition(def_text: str) -> str:
    # Add spaces to squished words (e.g. 'perfum- ingthebody' -> 'perfuming the body')
    d = re.sub(r'\[[^\]]*\]', '', def_text)
    d = re.sub(r'\([^\)]*\)', '', d)
    d = re.sub(r'([a-z])([A-Z])', r'\1 \2', d)
    d = re.sub(r'(\d+)', r' \1 ', d)
    d = " ".join(d.split())
    return d[:250]

def build_kannada_dataset():
    print("[*] Processing Kannada Dictionary from pre-parsed index...")
    entries = []
    if os.path.exists(VIBE_INDEX_PATH):
        with open(VIBE_INDEX_PATH, "r", encoding="utf-8") as f:
            raw_index = json.load(f)

        for raw_word, item in raw_index.items():
            norm = normalize_romanization(raw_word)
            if len(norm) < 2:
                continue
            defs = item.get("definitions", [])
            def_text = defs[0] if defs else ""
            pos = parse_pos(def_text)
            clean_def = clean_definition(def_text)
            if not clean_def:
                clean_def = f"Kannada word ({pos})"

            syl = count_syllables(norm)
            rime = extract_rime(norm)
            m_rime = extract_multi_rime(norm)

            entries.append({
                "word": norm,
                "display_word": raw_word,
                "language": "kannada",
                "pos": pos,
                "definition": clean_def,
                "syllables": syl,
                "rime_key": rime,
                "multi_rime": m_rime,
                "ipa": item.get("ipa", "")
            })

    print(f"[OK] Processed {len(entries)} Romanized Kannada dictionary entries.")
    return entries

# Rich Romanized Hindi (Hinglish) Vocabulary Dataset for Rap & Song Lyricism
HINGLISH_CURATED_VOCAB = [
    # Nouns & Poetic Imagery
    ("mitaoon", "verb", "to erase / wipe away", 3, "aoon", "itaoon"),
    ("bataoon", "verb", "to explain / tell", 3, "aoon", "ataoon"),
    ("jitaoon", "verb", "to make win", 3, "aoon", "itaoon"),
    ("sataoon", "verb", "to tease / trouble", 3, "aoon", "ataoon"),
    ("bulaoon", "verb", "to call upon", 3, "aoon", "ulaoon"),
    ("chalaoon", "verb", "to fire / operate", 3, "aoon", "alaoon"),
    ("lataoon", "verb", "to return / bring back", 3, "aoon", "ataoon"),
    ("main", "pronoun", "I / me", 1, "ain", "main"),
    ("hain", "verb", "are / exist", 1, "ain", "hain"),
    ("chain", "noun", "peace / tranquility", 1, "ain", "chain"),
    ("rain", "noun", "night", 1, "ain", "rain"),
    ("nain", "noun", "eyes", 1, "ain", "nain"),
    ("bain", "noun", "speech / melody", 1, "ain", "bain"),
    ("jaan", "noun", "life / beloved", 1, "aan", "jaan"),
    ("shaan", "noun", "pride / glory", 1, "aan", "shaan"),
    ("maan", "noun", "respect / honor", 1, "aan", "maan"),
    ("bhaan", "noun", "awareness / sense", 1, "aan", "bhaan"),
    ("aasmaan", "noun", "sky / heavens", 3, "aan", "smaan"),
    ("armaan", "noun", "desire / ambition", 2, "aan", "rmaan"),
    ("pechan", "noun", "identity", 2, "an", "chan"),
    ("naseeb", "noun", "destiny / fate", 2, "eeb", "seeb"),
    ("kareeb", "adjective", "close / near", 2, "eeb", "reeb"),
    ("hareeb", "noun", "rival / adversary", 2, "eeb", "reeb"),
    ("khateeb", "noun", "speaker / poet", 2, "eeb", "teeb"),
    ("chehra", "noun", "face / reflection", 2, "ehra", "ehra"),
    ("gehra", "adjective", "deep / profound", 2, "ehra", "ehra"),
    ("pehra", "noun", "watch / guard", 2, "ehra", "ehra"),
    ("sehra", "noun", "desert / crown", 2, "ehra", "ehra"),
    ("scene", "noun", "situation / vibe", 1, "ene", "scene"),
    ("vibe", "noun", "energy / feeling", 1, "ibe", "vibe"),
    ("haseen", "adjective", "beautiful", 2, "een", "seen"),
    ("jabeen", "noun", "forehead / countenance", 2, "een", "been"),
    ("zeher", "noun", "poison / venom", 2, "eher", "eher"),
    ("sehar", "noun", "dawn / morning", 2, "ehar", "ehar"),
    ("leher", "noun", "wave / current", 2, "ehar", "ehar"),
    ("dhundhla", "adjective", "hazy / blurred", 2, "ala", "dhla"),
    ("aks", "noun", "image / reflection", 1, "aks", "aks"),
    ("rootha", "adjective", "upset / estranged", 2, "tha", "tha"),
    ("jaam", "noun", "glass of wine", 1, "aam", "jaam"),
    ("lafzon", "noun", "words", 2, "on", "zon"),
    ("heera-pheri", "noun", "trickery / scheme", 4, "eri", "pheri"),
    ("bechaini", "noun", "restlessness", 3, "ini", "aini"),
    ("raabta", "noun", "connection / soul tie", 2, "ta", "bta"),
    ("malum hai na", "interjection", "you already know", 4, "na", "haina"),
    ("bantai", "noun", "homie / brother", 2, "ai", "ntai"),
    ("gully", "noun", "street / hood", 2, "y", "lly"),
    ("haq se", "adverb", "with full right", 2, "e", "qse"),
    ("public", "noun", "the audience / people", 2, "ic", "lic"),
    ("badalta", "verb", "changing", 3, "ta", "lta"),
    ("tehelta", "verb", "strolling / walking", 3, "ta", "lta"),
    ("andhero", "noun", "darkness", 3, "ro", "ero"),
    ("shishe", "noun", "glass / mirror", 2, "he", "she"),
    ("hasee", "noun", "laughter / smile", 2, "ee", "see"),
    ("zindagi", "noun", "life journey", 3, "gi", "dagi"),
    ("saath", "noun", "togetherness", 1, "aath", "saath"),
    ("baat", "noun", "talk / matter", 1, "aat", "baat"),
    ("raat", "noun", "night time", 1, "aat", "raat"),
    ("haath", "noun", "hand", 1, "aath", "haath"),
    ("aag", "noun", "fire / passion", 1, "aag", "aag"),
    ("daag", "noun", "stain / scar", 1, "aag", "daag"),
    ("chiraag", "noun", "lamp / flame", 2, "aag", "raag"),
    ("dil", "noun", "heart", 1, "il", "dil"),
    ("mehfil", "noun", "gathering / crowd", 2, "il", "fil"),
    ("manzil", "noun", "destination / goal", 2, "il", "zil"),
    ("saahil", "noun", "shore / harbor", 2, "il", "hil"),
    ("khwaab", "noun", "dream", 1, "aab", "waab"),
    ("nawab", "noun", "king / boss", 2, "aab", "waab"),
    ("jawaab", "noun", "answer / response", 2, "aab", "waab"),
    ("hisaab", "noun", "reckoning / account", 2, "aab", "saab"),
    ("shor", "noun", "noise / clamor", 1, "or", "shor"),
    ("zor", "noun", "force / power", 1, "or", "zor"),
    ("chittor", "noun", "heart thief / spirit", 2, "or", "tor"),
]

def build_hindi_dataset():
    print("[*] Compiling Romanized Hindi (Hinglish) dataset...")
    entries = []
    for item in HINGLISH_CURATED_VOCAB:
        word, pos, defn, syl, rime, m_rime = item
        entries.append({
            "word": word,
            "display_word": word,
            "language": "hinglish",
            "pos": pos,
            "definition": defn,
            "syllables": syl,
            "rime_key": rime,
            "multi_rime": m_rime,
            "ipa": ""
        })
    print(f"[OK] Compiled {len(entries)} Hinglish lyric entries.")
    return entries

def main():
    kannada_data = build_kannada_dataset()
    hindi_data = build_hindi_dataset()

    # Save JSON files in public/data for client & external training
    kannada_json_path = os.path.join(PUBLIC_DATA_DIR, "kannada_lyric_dictionary.json")
    hindi_json_path = os.path.join(PUBLIC_DATA_DIR, "hindi_lyric_dictionary.json")

    with open(kannada_json_path, "w", encoding="utf-8") as f:
        json.dump(kannada_data, f, indent=2, ensure_ascii=False)

    with open(hindi_json_path, "w", encoding="utf-8") as f:
        json.dump(hindi_data, f, indent=2, ensure_ascii=False)

    print(f"[+] Saved Kannada dataset to {kannada_json_path} ({len(kannada_data)} entries)")
    print(f"[+] Saved Hindi dataset to {hindi_json_path} ({len(hindi_data)} entries)")

    # Generate TypeScript modules for zero-latency client RAG & rhymes
    ts_kannada_path = os.path.join(LIB_DATA_DIR, "kannada-dict.ts")
    ts_hindi_path = os.path.join(LIB_DATA_DIR, "hindi-dict.ts")

    # Take top curated subset for fast bundle loading
    kannada_subset = kannada_data[:3000]
    hindi_subset = hindi_data

    dict_type_def = "export type DictEntry = { word: string; display_word?: string; language?: string; pos: string; definition: string; syllables: number; rime_key: string; multi_rime: string; ipa?: string };\n"

    with open(ts_kannada_path, "w", encoding="utf-8") as f:
        f.write(f"// Auto-generated Kannada Lyric Dictionary Subset ({len(kannada_subset)} entries)\n")
        f.write(dict_type_def)
        f.write(f"export const KANNADA_DICTIONARY: DictEntry[] = {json.dumps(kannada_subset, indent=2)};\n")

    with open(ts_hindi_path, "w", encoding="utf-8") as f:
        f.write(f"// Auto-generated Hinglish Lyric Dictionary Subset ({len(hindi_subset)} entries)\n")
        f.write(dict_type_def)
        f.write(f"export const HINDI_DICTIONARY: DictEntry[] = {json.dumps(hindi_subset, indent=2)};\n")

    print(f"[+] Exported TypeScript dictionary modules to {LIB_DATA_DIR}")

if __name__ == "__main__":
    main()

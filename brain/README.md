# VibeVox Localized Brain & Memory Drop-Folder

This folder is your localized memory and knowledge base for the VibeVox RAG engine.
Any files placed in the subfolders below will be automatically scanned, chunked, embedded, and injected into the lyric generation pipeline.

## Subdirectories

### 1. `lyrics/`
- **Format**: `.txt` or `.md`
- **Role**: Lyric sheets, song drafts, or reference verses.
- **Processing**: Automatically chunked into 4–8 bar segments. The engine analyzes syllable cadence and end-rhyme phonemes, embeds them into local vector storage, and retrieves them as few-shot style memory examples.
- **Example**: See `lyrics/sample-bars.txt`.

### 2. `personas/`
- **Format**: `.md` (Markdown with optional YAML frontmatter)
- **Role**: Artist voice profiles, attitude tags, signature motifs, and flow personality.
- **Processing**: Injected as the `[ARTIST PERSONA & VOICE]` directive in the writer's system prompt.
- **Example**: See `personas/sample-persona.md`.

### 3. `rhymes/`
- **Format**: `.json` or `.txt`
- **Role**: Custom rhyme pairs, regional slang, dialect vocabularies (e.g. Hinglish, Kanglish, UK Drill, Atlanta slang).
- **Processing**: Injected into the rhyme synthesizer and pattern banks for offline & online generation.
- **Example**: See `rhymes/sample-rhymes.json`.

### 4. `notes/`
- **Format**: `.md` or `.txt`
- **Role**: Writing rules, negative constraints, thematic notes, lore, or conceptual guidelines.
- **Processing**: Semantic chunks injected into the writer's system prompt as `[LOCAL BRAIN GUIDELINES]`.
- **Example**: See `notes/sample-rules.md`.

---

You can manage, inspect, and trigger a manual re-index at any time from the **/brain** tab in the app.

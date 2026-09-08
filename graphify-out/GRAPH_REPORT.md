# Graph Report - D:\GitHub\VibeVox  (2026-09-08)

## Corpus Check
- 156 files · ~120,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1060 nodes · 2898 edges · 49 communities (48 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Track Management & Studio Pipeline|Track Management & Studio Pipeline]]
- [[_COMMUNITY_Cadence, Stress & Indic Romanizer|Cadence, Stress & Indic Romanizer]]
- [[_COMMUNITY_Style Memory & Artistic Ghostwriter RAG|Style Memory & Artistic Ghostwriter RAG]]
- [[_COMMUNITY_Audio Capture, Latency & Live Punch-In|Audio Capture, Latency & Live Punch-In]]
- [[_COMMUNITY_Studio Arsenal & Lyrical Intelligence|Studio Arsenal & Lyrical Intelligence]]
- [[_COMMUNITY_Headspace Journal & Evolution Analytics|Headspace Journal & Evolution Analytics]]
- [[_COMMUNITY_Module Cluster 6|Module Cluster 6]]
- [[_COMMUNITY_Module Cluster 7|Module Cluster 7]]
- [[_COMMUNITY_Module Cluster 8|Module Cluster 8]]
- [[_COMMUNITY_Module Cluster 9|Module Cluster 9]]
- [[_COMMUNITY_Module Cluster 10|Module Cluster 10]]
- [[_COMMUNITY_Module Cluster 11|Module Cluster 11]]
- [[_COMMUNITY_Module Cluster 12|Module Cluster 12]]
- [[_COMMUNITY_Module Cluster 13|Module Cluster 13]]
- [[_COMMUNITY_Module Cluster 14|Module Cluster 14]]
- [[_COMMUNITY_Module Cluster 15|Module Cluster 15]]
- [[_COMMUNITY_Module Cluster 16|Module Cluster 16]]
- [[_COMMUNITY_Module Cluster 17|Module Cluster 17]]
- [[_COMMUNITY_Module Cluster 18|Module Cluster 18]]
- [[_COMMUNITY_Module Cluster 19|Module Cluster 19]]
- [[_COMMUNITY_Module Cluster 20|Module Cluster 20]]
- [[_COMMUNITY_Module Cluster 21|Module Cluster 21]]
- [[_COMMUNITY_Module Cluster 22|Module Cluster 22]]
- [[_COMMUNITY_Module Cluster 23|Module Cluster 23]]
- [[_COMMUNITY_Module Cluster 24|Module Cluster 24]]
- [[_COMMUNITY_Module Cluster 25|Module Cluster 25]]
- [[_COMMUNITY_Module Cluster 26|Module Cluster 26]]
- [[_COMMUNITY_Module Cluster 27|Module Cluster 27]]
- [[_COMMUNITY_Module Cluster 28|Module Cluster 28]]
- [[_COMMUNITY_Module Cluster 29|Module Cluster 29]]
- [[_COMMUNITY_Module Cluster 30|Module Cluster 30]]
- [[_COMMUNITY_Module Cluster 31|Module Cluster 31]]
- [[_COMMUNITY_Module Cluster 32|Module Cluster 32]]
- [[_COMMUNITY_Module Cluster 33|Module Cluster 33]]
- [[_COMMUNITY_Module Cluster 34|Module Cluster 34]]
- [[_COMMUNITY_Module Cluster 35|Module Cluster 35]]
- [[_COMMUNITY_Module Cluster 36|Module Cluster 36]]
- [[_COMMUNITY_Module Cluster 37|Module Cluster 37]]
- [[_COMMUNITY_Module Cluster 38|Module Cluster 38]]
- [[_COMMUNITY_Module Cluster 39|Module Cluster 39]]
- [[_COMMUNITY_Module Cluster 40|Module Cluster 40]]
- [[_COMMUNITY_Module Cluster 41|Module Cluster 41]]
- [[_COMMUNITY_Module Cluster 42|Module Cluster 42]]
- [[_COMMUNITY_Module Cluster 43|Module Cluster 43]]

## God Nodes (most connected - your core abstractions)
1. `countSyllables()` - 39 edges
2. `Button` - 38 edges
3. `Badge()` - 32 edges
4. `cn()` - 31 edges
5. `Card` - 28 edges
6. `romanizeIndic()` - 26 edges
7. `endRhymeKey()` - 26 edges
8. `runLocalPipeline()` - 22 edges
9. `fetch()` - 20 edges
10. `cacheSet()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `transcribeAudio()` --calls--> `fetch()`  [INFERRED]
  src/lib/ai-gateway.server.ts → src/server.ts
- `callLocal()` --calls--> `fetch()`  [INFERRED]
  src/lib/embeddings.ts → src/server.ts
- `generateHooks()` --calls--> `fetch()`  [INFERRED]
  src/lib/hook-engine.ts → src/server.ts
- `pingLlm()` --calls--> `fetch()`  [INFERRED]
  src/lib/llm-config.ts → src/server.ts
- `fetchTimeout()` --calls--> `fetch()`  [INFERRED]
  src/lib/local-discovery.ts → src/server.ts

## Import Cycles
- 3-file cycle: `src/lib/journal-rag.ts -> src/lib/local-store.ts -> src/lib/local-pipeline.ts -> src/lib/journal-rag.ts`

## Communities (49 total, 1 thin omitted)

### Community 0 - "Track Management & Studio Pipeline"
Cohesion: 0.06
Nodes (63): ConnectPage(), getBrainPromptDirectives(), formatJournalContextForPrompt(), briefBlock(), buildCadence(), ChatOpts, criticPass(), fillToCadence() (+55 more)

### Community 1 - "Cadence, Stress & Indic Romanizer"
Cohesion: 0.07
Nodes (53): callCloud(), callLocal(), cosineSim(), EmbedBackend, EmbedContext, embeddingsAvailable(), embedMany(), embedOne() (+45 more)

### Community 2 - "Style Memory & Artistic Ghostwriter RAG"
Cohesion: 0.08
Nodes (53): SettingsPage(), Status, LlmScanPanel(), saveBrainFile, generateAlgorithmicHooks(), GeneratedHook, generateHooks(), HookOptions (+45 more)

### Community 3 - "Audio Capture, Latency & Live Punch-In"
Cohesion: 0.06
Nodes (54): createAiGateway(), transcribeAudio(), BarRewriteOptions, BarRewriteSchema, briefBlock(), callCriticGemini(), CouncilVerdict, CriticResponseSchema (+46 more)

### Community 4 - "Studio Arsenal & Lyrical Intelligence"
Cohesion: 0.07
Nodes (44): approxBytes(), cacheGet(), CacheNamespace, CacheRecord, cacheSet(), cacheStats, clearCache(), enforceLimit() (+36 more)

### Community 5 - "Headspace Journal & Evolution Analytics"
Cohesion: 0.10
Nodes (37): JournalRecallOptions, JournalRecallResult, recallRelevantJournalEntries(), STOP_WORDS, tokenize(), barsForTrack(), base64ToBlob(), blobToBase64() (+29 more)

### Community 6 - "Module Cluster 6"
Cohesion: 0.07
Nodes (26): consumeLastCapturedError(), renderErrorPage(), getAdmin(), fetch(), getServerEntry(), normalizeCatastrophicSsrResponse(), ServerEntry, errorMiddleware (+18 more)

### Community 7 - "Module Cluster 7"
Cohesion: 0.08
Nodes (34): Route, Route, Route, Route, Route, Route, Route, Route (+26 more)

### Community 8 - "Module Cluster 8"
Cohesion: 0.11
Nodes (30): BrainPage(), BrainCategorySchema, deleteBrainFile, DeleteFileInput, SaveFileInput, scanBrainDirectory, BrainNote, BrainPersona (+22 more)

### Community 9 - "Module Cluster 9"
Cohesion: 0.16
Nodes (19): groups, RhymeLookupProps, JournalDrawerProps, QUICK_MOODS, searchWebLyrics(), WebLyricsResult, HOOK_MOODS, PUNCHLINE_MOODS (+11 more)

### Community 10 - "Module Cluster 10"
Cohesion: 0.16
Nodes (25): LlmScanPanelProps, WhisperScanPanel(), WhisperScanPanelProps, DEFAULT_LLM_CONFIG, LlmConfig, saveLlmConfig(), setKeyFor(), corsHint() (+17 more)

### Community 11 - "Module Cluster 11"
Cohesion: 0.09
Nodes (25): Route, discoverLlmBackends(), discoverWhisperBackends(), fetchTimeout(), getOllamaContextLength(), listOllamaModels(), listOpenAIModels(), LLM_CANDIDATES (+17 more)

### Community 12 - "Module Cluster 12"
Cohesion: 0.16
Nodes (20): ReferencesPage(), BarDiff(), diffWords(), tokenize(), buildFingerprint(), Fingerprint, loadFingerprints(), removeFingerprint() (+12 more)

### Community 13 - "Module Cluster 13"
Cohesion: 0.16
Nodes (17): AudioPlayer(), BarProposal, BarRow(), BarRowProps, BarVersion, RewriteOpts, BulkOpts, BulkRewriteBar() (+9 more)

### Community 14 - "Module Cluster 14"
Cohesion: 0.16
Nodes (14): MOODS, CachePanel(), LABELS, formatBytes(), ScribbleResult, ScribbleResultViewProps, AudioPlayerProps, Badge() (+6 more)

### Community 15 - "Module Cluster 15"
Cohesion: 0.10
Nodes (16): BarLocalState, BarSlice, bulkKey(), BulkPersist, loadBulk(), Lyrics, saveBulk(), trackSearchSchema (+8 more)

### Community 16 - "Module Cluster 16"
Cohesion: 0.16
Nodes (17): BarPocketItem, COLOR_PALETTE, PocketGrid(), PocketGridProps, calcSchemeSophisticationScore(), CadenceBar, CLICHES, QualityScore (+9 more)

### Community 17 - "Module Cluster 17"
Cohesion: 0.17
Nodes (14): ATTITUDES, GENRES, REGIONS, cn(), FlowMetronomeBar(), FlowMetronomeBarProps, labelVariants, MultiSelect() (+6 more)

### Community 18 - "Module Cluster 18"
Cohesion: 0.12
Nodes (20): ARPABET_VOWELS, COMMON_STOP_WORDS, detectInternalRhymes(), detectRhetoricalFraming(), FlowInsight, G2P_RULES, getRhymingPart(), getStanzaRhymeScheme() (+12 more)

### Community 19 - "Module Cluster 19"
Cohesion: 0.11
Nodes (11): BarRow, encodeWav(), writeString(), AudioWaveform(), AudioWaveformProps, MetronomeRing(), MetronomeRingProps, RhymeLookup() (+3 more)

### Community 20 - "Module Cluster 20"
Cohesion: 0.17
Nodes (20): TrackPage(), detectFlowMetric(), calcAssonanceScore(), calcConsonanceScore(), calcHomophoneScore(), calcInternalRhymeScore(), calcMultisyllabicScore(), calcVocabularyScore() (+12 more)

### Community 21 - "Module Cluster 21"
Cohesion: 0.14
Nodes (17): DictEntry, KANNADA_DICTIONARY, CaesuraResult, calculateRhythmicScore(), CodeSwitchResult, detectLanguage(), DoppelreimResult, DoppelreimSearchOptions (+9 more)

### Community 22 - "Module Cluster 22"
Cohesion: 0.15
Nodes (15): KeyboardShortcutsOverlay(), LocalStatusPill(), NotificationCenter(), NotificationContext, NotificationContextType, NotificationItem, NotificationProvider(), useNotifications() (+7 more)

### Community 23 - "Module Cluster 23"
Cohesion: 0.15
Nodes (15): ComplexityGrade, ComplexityScoreResult, SemanticDriftResult, toPlainText(), ComplexityGauge(), ComplexityGaugeProps, DIMENSION_CONFIG, getGradeBadgeVariant() (+7 more)

### Community 24 - "Module Cluster 24"
Cohesion: 0.17
Nodes (15): deleteTrackSnapshot(), listTrackSnapshots(), saveTrackSnapshot(), TrackSnapshot, VersionHistory(), VersionHistoryProps, DropdownMenuCheckboxItem, DropdownMenuContent (+7 more)

### Community 25 - "Module Cluster 25"
Cohesion: 0.20
Nodes (12): PREMADE_STRUCTURES, SCRIBBLE_MODES, ScribblePage(), JournalDrawer(), getLineStressAnalysis(), getDeviceId(), putBars(), putTrack() (+4 more)

### Community 26 - "Module Cluster 26"
Cohesion: 0.21
Nodes (15): downloadBlob(), escapeHtml(), flatLines(), Lyrics, openMultiTrackPrintWindow(), openPrintWindow(), slugify(), toGeniusMarkdown() (+7 more)

### Community 27 - "Module Cluster 27"
Cohesion: 0.18
Nodes (13): cmudictLookup(), customLookup(), datamuse(), DatamuseHit, datamuseLookup(), lookupRhymes(), RhymeHit, RhymeKind (+5 more)

### Community 28 - "Module Cluster 28"
Cohesion: 0.16
Nodes (14): calculateMatra(), DEVANAGARI_CONSONANTS, DEVANAGARI_INDEPENDENT_VOWELS, DEVANAGARI_MATRAS, devanagariToHinglish(), DIACRITIC_MAP, hasDevanagariScript(), hasKannadaScript() (+6 more)

### Community 29 - "Module Cluster 29"
Cohesion: 0.16
Nodes (5): CapturedError, formatDiagnostics(), reportCustomError(), Toaster(), ToasterProps

### Community 30 - "Module Cluster 30"
Cohesion: 0.18
Nodes (8): LiveCapture, LiveCaptureOpts, playClick(), State, blobToBase64(), encodeWav(), rms(), writeString()

### Community 31 - "Module Cluster 31"
Cohesion: 0.18
Nodes (10): LibraryPage(), SortKey, EmptyState(), EmptyStateProps, toMultiTrackGeniusMarkdown(), toMultiTrackPlainText(), TrackExportItem, isLocalOnly() (+2 more)

### Community 32 - "Module Cluster 32"
Cohesion: 0.27
Nodes (9): BarTimelineProps, SOURCE_LABELS, BarVersion, clearBarHistory(), getBarHistory(), getLatestBarVersion(), loadAll(), recordBarVersion() (+1 more)

### Community 33 - "Module Cluster 33"
Cohesion: 0.33
Nodes (11): DictEntry, HINDI_DICTIONARY, findRhymesWithPos(), getHindiDictSync(), getKannadaDictSync(), getWordMetadata(), searchDictionaryWords(), WordMatch (+3 more)

### Community 34 - "Module Cluster 34"
Cohesion: 0.25
Nodes (10): CalibrateOpts, calibrateWithRetry(), clearCalibratedLatencyMs(), detectPeaks(), LatencyResult, loadCalibratedLatencyMs(), measureMicLatencyMs(), mergeChunks() (+2 more)

### Community 35 - "Module Cluster 35"
Cohesion: 0.25
Nodes (9): syllablesInWord(), ARPABET_VOWELS, decomposeWordSyllables(), extractCoda(), extractPrimaryVowelNucleus(), LearnedRhymeEntry, LineSyllableMap, splitWordByVowelClusters() (+1 more)

### Community 36 - "Module Cluster 36"
Cohesion: 0.22
Nodes (6): ImportMergeDialog(), Strategy, ImportChoice, DialogFooter(), ScrollArea, ScrollBar

### Community 37 - "Module Cluster 37"
Cohesion: 0.20
Nodes (9): CommitBar, CommitInput, commitLiveTake, DeviceId, GenerateBarInput, generateLiveBar, StyleBriefSchema, transcribeBar (+1 more)

### Community 38 - "Module Cluster 38"
Cohesion: 0.38
Nodes (9): build_hindi_dataset(), build_kannada_dataset(), clean_definition(), count_syllables(), extract_multi_rime(), extract_rime(), main(), normalize_romanization() (+1 more)

### Community 39 - "Module Cluster 39"
Cohesion: 0.29
Nodes (5): Props, QualityRadar(), TrackQuality, TrackScorecard(), TrackScorecardProps

### Community 41 - "Module Cluster 41"
Cohesion: 0.40
Nodes (3): FEATURES, Route, STEPS

### Community 42 - "Module Cluster 42"
Cohesion: 0.40
Nodes (4): getRouter(), Register, routeTree, startInstance

### Community 43 - "Module Cluster 43"
Cohesion: 0.67
Nodes (3): BpmResult, detectBpm(), snapBpm()

## Knowledge Gaps
- **256 isolated node(s):** `AppRoute`, `IndexRoute`, `AppStatsRoute`, `AppSettingsRoute`, `AppScribbleRoute` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `countSyllables()` connect `Module Cluster 20` to `Track Management & Studio Pipeline`, `Cadence, Stress & Indic Romanizer`, `Style Memory & Artistic Ghostwriter RAG`, `Audio Capture, Latency & Live Punch-In`, `Module Cluster 35`, `Module Cluster 37`, `Headspace Journal & Evolution Analytics`, `Module Cluster 8`, `Module Cluster 9`, `Module Cluster 12`, `Module Cluster 13`, `Module Cluster 14`, `Module Cluster 15`, `Module Cluster 16`, `Module Cluster 18`, `Module Cluster 21`, `Module Cluster 25`, `Module Cluster 28`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Button` connect `Module Cluster 14` to `Cadence, Stress & Indic Romanizer`, `Module Cluster 9`, `Module Cluster 10`, `Module Cluster 11`, `Module Cluster 13`, `Module Cluster 15`, `Module Cluster 17`, `Module Cluster 19`, `Module Cluster 22`, `Module Cluster 23`, `Module Cluster 24`, `Module Cluster 25`, `Module Cluster 26`, `Module Cluster 29`, `Module Cluster 31`, `Module Cluster 32`, `Module Cluster 36`, `Module Cluster 39`, `Module Cluster 41`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `getAdmin()` connect `Module Cluster 6` to `Audio Capture, Latency & Live Punch-In`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `AppRoute`, `IndexRoute`, `AppStatsRoute` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Track Management & Studio Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.060455486542443065 - nodes in this community are weakly interconnected._
- **Should `Cadence, Stress & Indic Romanizer` be split into smaller, more focused modules?**
  _Cohesion score 0.07067307692307692 - nodes in this community are weakly interconnected._
- **Should `Style Memory & Artistic Ghostwriter RAG` be split into smaller, more focused modules?**
  _Cohesion score 0.07514124293785311 - nodes in this community are weakly interconnected._
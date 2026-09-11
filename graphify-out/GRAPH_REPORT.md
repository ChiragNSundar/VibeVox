# Graph Report - D:\GitHub\VibeVox  (2026-09-11)

## Corpus Check
- 161 files · ~120,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1108 nodes · 3073 edges · 55 communities (53 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Module Cluster 44|Module Cluster 44]]
- [[_COMMUNITY_Module Cluster 45|Module Cluster 45]]
- [[_COMMUNITY_Module Cluster 46|Module Cluster 46]]
- [[_COMMUNITY_Module Cluster 47|Module Cluster 47]]
- [[_COMMUNITY_Module Cluster 48|Module Cluster 48]]
- [[_COMMUNITY_Module Cluster 52|Module Cluster 52]]

## God Nodes (most connected - your core abstractions)
1. `countSyllables()` - 42 edges
2. `Button` - 38 edges
3. `Badge()` - 32 edges
4. `cn()` - 31 edges
5. `Card` - 28 edges
6. `romanizeIndic()` - 26 edges
7. `endRhymeKey()` - 26 edges
8. `loadLlmConfig()` - 23 edges
9. `cacheSet()` - 22 edges
10. `runLocalPipeline()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `transcribeAudio()` --calls--> `fetch()`  [INFERRED]
  src/lib/ai-gateway.server.ts → src/server.ts
- `callChatLlm()` --calls--> `fetch()`  [INFERRED]
  src/lib/chat-client.ts → src/server.ts
- `callLocal()` --calls--> `fetch()`  [INFERRED]
  src/lib/embeddings.ts → src/server.ts
- `fetchTimeout()` --calls--> `fetch()`  [INFERRED]
  src/lib/local-discovery.ts → src/server.ts
- `rawChat()` --calls--> `fetch()`  [INFERRED]
  src/lib/local-pipeline.ts → src/server.ts

## Import Cycles
- 3-file cycle: `src/lib/journal-rag.ts -> src/lib/local-store.ts -> src/lib/local-pipeline.ts -> src/lib/journal-rag.ts`

## Communities (55 total, 2 thin omitted)

### Community 0 - "Track Management & Studio Pipeline"
Cohesion: 0.05
Nodes (68): getBrainPromptDirectives(), loadBrainState(), formatJournalContextForPrompt(), JournalRecallOptions, JournalRecallResult, recallRelevantJournalEntries(), STOP_WORDS, tokenize() (+60 more)

### Community 1 - "Cadence, Stress & Indic Romanizer"
Cohesion: 0.07
Nodes (55): DictEntry, HINDI_DICTIONARY, DictEntry, KANNADA_DICTIONARY, calculateMatra(), findDwitiyaksharaMatches(), findRhymesWithPos(), getHindiDictSync() (+47 more)

### Community 2 - "Style Memory & Artistic Ghostwriter RAG"
Cohesion: 0.08
Nodes (48): ReferencesPage(), BarDiff(), diffWords(), tokenize(), buildFingerprint(), Fingerprint, fingerprintToConstraints(), loadFingerprints() (+40 more)

### Community 3 - "Audio Capture, Latency & Live Punch-In"
Cohesion: 0.07
Nodes (47): BrainPage(), BrainCategorySchema, deleteBrainFile, DeleteFileInput, saveBrainFile, SaveFileInput, scanBrainDirectory, BrainNote (+39 more)

### Community 4 - "Studio Arsenal & Lyrical Intelligence"
Cohesion: 0.10
Nodes (39): generateGhostwriteNextBars(), callChatLlm(), ChatClientOptions, ChatMessage, cleanModelOutput(), generateAlgorithmicHooks(), generateHooks(), HookOptions (+31 more)

### Community 5 - "Headspace Journal & Evolution Analytics"
Cohesion: 0.07
Nodes (25): consumeLastCapturedError(), renderErrorPage(), getAdmin(), getServerEntry(), normalizeCatastrophicSsrResponse(), ServerEntry, errorMiddleware, attachSupabaseAuth (+17 more)

### Community 6 - "Module Cluster 6"
Cohesion: 0.12
Nodes (32): barsForTrack(), base64ToBlob(), blobToBase64(), Bundle, deleteBlob(), deleteJournalEntry(), deleteTrack(), downloadBundle() (+24 more)

### Community 7 - "Module Cluster 7"
Cohesion: 0.14
Nodes (28): SettingsPage(), ImportMergeDialog(), Status, LlmScanPanel(), DEFAULT_LLM_CONFIG, inferProvider(), isLocalConfig(), isOfflineReady() (+20 more)

### Community 8 - "Module Cluster 8"
Cohesion: 0.11
Nodes (28): ScribblePage(), DecorativeExportOptions, escapeHtml(), exportColoredWordDoc(), exportDecorativePdf(), generateAestheticLyricSheetHtml(), generateColoredWordDocument(), parseSectionsFromText() (+20 more)

### Community 9 - "Module Cluster 9"
Cohesion: 0.11
Nodes (24): BarPocketItem, COLOR_PALETTE, PocketGridProps, CaesuraResult, calculateRhythmicScore(), CodeSwitchResult, detectFlowMetric(), detectLanguage() (+16 more)

### Community 10 - "Module Cluster 10"
Cohesion: 0.17
Nodes (22): ConnectPage(), LlmScanPanelProps, WhisperScanPanel(), WhisperScanPanelProps, corsHint(), detectModel(), CatalogModel, embeddingProviders() (+14 more)

### Community 11 - "Module Cluster 11"
Cohesion: 0.12
Nodes (23): LibraryPage(), SortKey, EmptyState(), EmptyStateProps, downloadBlob(), escapeHtml(), flatLines(), Lyrics (+15 more)

### Community 12 - "Module Cluster 12"
Cohesion: 0.13
Nodes (20): CadenceMap, AudioPlayer(), AudioPlayerProps, BarProposal, BarRow(), BarRowProps, BarVersion, RewriteOpts (+12 more)

### Community 13 - "Module Cluster 13"
Cohesion: 0.09
Nodes (24): BarRewriteInput, buildCadenceMap(), CadenceMapSchema, CreateTrackInput, deleteTrack, DeviceId, EditorResultSchema, getTrack (+16 more)

### Community 14 - "Module Cluster 14"
Cohesion: 0.09
Nodes (24): getRouter(), AppBrainRoute, AppConnectRoute, AppJournalRoute, AppLibraryRoute, AppLiveRoute, AppNewRoute, AppOnboardingRoute (+16 more)

### Community 15 - "Module Cluster 15"
Cohesion: 0.11
Nodes (20): DiscoveredLlm, DiscoveredWhisper, discoverLlmBackends(), discoverWhisperBackends(), fetchTimeout(), getOllamaContextLength(), listOllamaModels(), listOpenAIModels() (+12 more)

### Community 16 - "Module Cluster 16"
Cohesion: 0.15
Nodes (20): CachePanel(), LABELS, AiRhymeGroup, buildLocalFastRhymeFallback(), generateAiRhymes(), approxBytes(), cacheGet(), CacheNamespace (+12 more)

### Community 17 - "Module Cluster 17"
Cohesion: 0.15
Nodes (23): PocketGrid(), calcAssonanceScore(), calcConsonanceScore(), calcHomophoneScore(), calcInternalRhymeScore(), calcMultisyllabicScore(), calcSchemeSophisticationScore(), calcVocabularyScore() (+15 more)

### Community 18 - "Module Cluster 18"
Cohesion: 0.13
Nodes (16): groups, KeyboardShortcutsOverlay(), LocalStatusPill(), NotificationCenter(), NotificationContext, NotificationContextType, NotificationItem, NotificationProvider() (+8 more)

### Community 19 - "Module Cluster 19"
Cohesion: 0.15
Nodes (18): hashBlob(), hashInputs(), sha256Hex(), chatInBrowser(), getModelId(), getWhisperModelId(), InBrowserEmbedConfig, InBrowserLlmConfig (+10 more)

### Community 20 - "Module Cluster 20"
Cohesion: 0.21
Nodes (12): ATTITUDES, GENRES, REGIONS, cn(), Input, MultiSelect(), MultiSelectOption, MultiSelectProps (+4 more)

### Community 21 - "Module Cluster 21"
Cohesion: 0.15
Nodes (17): createAiGateway(), transcribeAudio(), BarRewriteOptions, BarRewriteSchema, briefBlock(), callCriticGemini(), CouncilVerdict, CriticResponseSchema (+9 more)

### Community 22 - "Module Cluster 22"
Cohesion: 0.18
Nodes (11): MOODS, JournalEntry, saveJournalEntry(), ScribbleResult, ScribbleResultViewProps, Badge(), BadgeProps, badgeVariants (+3 more)

### Community 23 - "Module Cluster 23"
Cohesion: 0.18
Nodes (14): CmudictRhymeHit, ensureCmudictLoaded(), findRhymes(), findRhymesBySound(), getAllPhonemes(), getLastStressedVowel(), getRhymeEnding(), getVowelPhonemes() (+6 more)

### Community 24 - "Module Cluster 24"
Cohesion: 0.14
Nodes (9): BarRow, AudioWaveform(), AudioWaveformProps, MetronomeRing(), MetronomeRingProps, DEFAULT_BRIEF, StyleBrief, Label (+1 more)

### Community 25 - "Module Cluster 25"
Cohesion: 0.14
Nodes (11): BarLocalState, BarSlice, bulkKey(), BulkPersist, loadBulk(), Lyrics, saveBulk(), TrackPage() (+3 more)

### Community 26 - "Module Cluster 26"
Cohesion: 0.18
Nodes (11): Strategy, JournalDrawerProps, QUICK_MOODS, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay (+3 more)

### Community 27 - "Module Cluster 27"
Cohesion: 0.16
Nodes (14): ComplexityGrade, ComplexityScoreResult, SemanticDriftResult, toPlainText(), ComplexityGauge(), ComplexityGaugeProps, DIMENSION_CONFIG, getGradeBadgeVariant() (+6 more)

### Community 28 - "Module Cluster 28"
Cohesion: 0.18
Nodes (14): deleteTrackSnapshot(), listTrackSnapshots(), saveTrackSnapshot(), TrackSnapshot, VersionHistoryProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+6 more)

### Community 29 - "Module Cluster 29"
Cohesion: 0.23
Nodes (8): encodeWav(), writeString(), StyleBriefForm(), createTrack, TabsContent, TabsList, TabsTrigger, Textarea

### Community 30 - "Module Cluster 30"
Cohesion: 0.16
Nodes (5): CapturedError, formatDiagnostics(), reportCustomError(), Toaster(), ToasterProps

### Community 31 - "Module Cluster 31"
Cohesion: 0.18
Nodes (8): LiveCapture, LiveCaptureOpts, playClick(), State, blobToBase64(), encodeWav(), rms(), writeString()

### Community 32 - "Module Cluster 32"
Cohesion: 0.22
Nodes (9): PREMADE_STRUCTURES, SCRIBBLE_MODES, JournalDrawer(), ScribbleMode, FlowMetronomeBar(), FlowMetronomeBarProps, InlineRhymeDock(), ScribbleResultView() (+1 more)

### Community 33 - "Module Cluster 33"
Cohesion: 0.25
Nodes (14): briefToPromptBlock(), coerceLyrics(), editorPass(), fallbackLyricLines(), fallbackLyrics(), flattenLyricsLines(), groupBarsIntoLyrics(), normalizeLyrics() (+6 more)

### Community 34 - "Module Cluster 34"
Cohesion: 0.15
Nodes (13): Route, Route, Route, Route, Route, Route, Route, Route (+5 more)

### Community 35 - "Module Cluster 35"
Cohesion: 0.27
Nodes (9): BarTimelineProps, SOURCE_LABELS, BarVersion, clearBarHistory(), getBarHistory(), getLatestBarVersion(), loadAll(), recordBarVersion() (+1 more)

### Community 36 - "Module Cluster 36"
Cohesion: 0.22
Nodes (11): CadenceBar, CLICHES, countCliches(), QualityScore, scoreCadenceMatch(), avgRhymeChainSyllables(), endRhymeKey(), rhymeStrength() (+3 more)

### Community 37 - "Module Cluster 37"
Cohesion: 0.23
Nodes (10): analyzeMultisyllabicChains(), ARPABET_VOWELS, decomposeWordSyllables(), extractCoda(), extractPrimaryVowelNucleus(), LearnedRhymeEntry, LineSyllableMap, recordLearnedRhymePattern() (+2 more)

### Community 38 - "Module Cluster 38"
Cohesion: 0.25
Nodes (10): CalibrateOpts, calibrateWithRetry(), clearCalibratedLatencyMs(), detectPeaks(), LatencyResult, loadCalibratedLatencyMs(), measureMicLatencyMs(), mergeChunks() (+2 more)

### Community 39 - "Module Cluster 39"
Cohesion: 0.20
Nodes (9): CommitBar, CommitInput, commitLiveTake, DeviceId, GenerateBarInput, generateLiveBar, StyleBriefSchema, transcribeBar (+1 more)

### Community 40 - "Module Cluster 40"
Cohesion: 0.24
Nodes (8): CatalogInput, ChatInput, PingInput, proxyCatalogFn, proxyChatFn, proxyPingFn, rawChat(), fetchCatalog()

### Community 41 - "Module Cluster 41"
Cohesion: 0.38
Nodes (9): build_hindi_dataset(), build_kannada_dataset(), clean_definition(), count_syllables(), extract_multi_rime(), extract_rime(), main(), normalize_romanization() (+1 more)

### Community 42 - "Module Cluster 42"
Cohesion: 0.29
Nodes (5): Props, QualityRadar(), TrackQuality, TrackScorecard(), TrackScorecardProps

### Community 43 - "Module Cluster 43"
Cohesion: 0.29
Nodes (7): RhymeLookup(), RhymeLookupProps, AiRhymeItem, AiRhymeResult, DoppelreimResult, LanguageCode, rhymeWaveUrl()

### Community 44 - "Module Cluster 44"
Cohesion: 0.29
Nodes (6): GeneratedHook, ScoredPunchline, HOOK_MOODS, PUNCHLINE_MOODS, StudioArsenalDrawer(), StudioArsenalDrawerProps

### Community 45 - "Module Cluster 45"
Cohesion: 0.43
Nodes (5): FxName, getCtx(), isSoundFxEnabled(), playFx(), playTone()

### Community 47 - "Module Cluster 47"
Cohesion: 0.40
Nodes (3): FEATURES, Route, STEPS

### Community 48 - "Module Cluster 48"
Cohesion: 0.67
Nodes (3): BpmResult, detectBpm(), snapBpm()

## Knowledge Gaps
- **270 isolated node(s):** `AppRoute`, `IndexRoute`, `AppStatsRoute`, `AppSettingsRoute`, `AppScribbleRoute` (+265 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `countSyllables()` connect `Module Cluster 9` to `Track Management & Studio Pipeline`, `Cadence, Stress & Indic Romanizer`, `Style Memory & Artistic Ghostwriter RAG`, `Audio Capture, Latency & Live Punch-In`, `Studio Arsenal & Lyrical Intelligence`, `Module Cluster 6`, `Module Cluster 8`, `Module Cluster 12`, `Module Cluster 13`, `Module Cluster 16`, `Module Cluster 17`, `Module Cluster 22`, `Module Cluster 25`, `Module Cluster 29`, `Module Cluster 32`, `Module Cluster 33`, `Module Cluster 36`, `Module Cluster 39`, `Module Cluster 43`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Button` connect `Module Cluster 22` to `Style Memory & Artistic Ghostwriter RAG`, `Module Cluster 7`, `Module Cluster 10`, `Module Cluster 11`, `Module Cluster 12`, `Module Cluster 15`, `Module Cluster 16`, `Module Cluster 18`, `Module Cluster 24`, `Module Cluster 25`, `Module Cluster 26`, `Module Cluster 27`, `Module Cluster 28`, `Module Cluster 29`, `Module Cluster 30`, `Module Cluster 32`, `Module Cluster 35`, `Module Cluster 42`, `Module Cluster 43`, `Module Cluster 44`, `Module Cluster 47`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `getAdmin()` connect `Headspace Journal & Evolution Analytics` to `Module Cluster 13`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `AppRoute`, `IndexRoute`, `AppStatsRoute` to the rest of the system?**
  _270 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Track Management & Studio Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.05157894736842105 - nodes in this community are weakly interconnected._
- **Should `Cadence, Stress & Indic Romanizer` be split into smaller, more focused modules?**
  _Cohesion score 0.07211538461538461 - nodes in this community are weakly interconnected._
- **Should `Style Memory & Artistic Ghostwriter RAG` be split into smaller, more focused modules?**
  _Cohesion score 0.07644110275689223 - nodes in this community are weakly interconnected._
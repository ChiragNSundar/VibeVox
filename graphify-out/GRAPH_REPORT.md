# Graph Report - D:\GitHub\Vocal Muse  (2026-07-28)

## Corpus Check
- Large corpus: 177 files · ~938,642 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1105 nodes · 2247 edges · 63 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 70 edges
2. `loadStyleMemory()` - 22 edges
3. `cacheSet()` - 20 edges
4. `Button` - 19 edges
5. `runLocalPipeline()` - 19 edges
6. `Badge()` - 18 edges
7. `hashInputs()` - 18 edges
8. `endRhymeKey()` - 18 edges
9. `countSyllables()` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `transcribeAudio()` --calls--> `fetch()`  [INFERRED]
  src/lib/ai-gateway.server.ts → src/server.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts
- `CommandShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/command.tsx → src/lib/utils.ts
- `ContextMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/context-menu.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (63 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (54): BackendCard(), RecommendedInstall(), RecommendedWhisperInstall(), encodeWav(), writeString(), Status, StyleBriefForm(), DEFAULT_LLM_CONFIG (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (48): SettingsPage(), TRAINING_SEEDS, ImportMergeDialog(), Strategy, harvestFromUrl, Input, searchWebLyrics(), WebLyricsResult (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (61): dependencies, ai, @ai-sdk/openai-compatible, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react (+53 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (56): createLovableGateway(), transcribeAudio(), BarRewriteOptions, BarRewriteSchema, briefBlock(), callCriticGemini(), CouncilVerdict, CriticResponseSchema (+48 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (29): consumeLastCapturedError(), renderErrorPage(), getAdmin(), lovable, lovableAuth, SignInOptions, fetch(), getServerEntry() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (36): useIsMobile(), Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (31): Route, Route, Route, Route, Route, Route, Route, Route (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (24): BarPocketItem, COLOR_PALETTE, PocketGrid(), PocketGridProps, Fingerprint, CadenceBar, CLICHES, countCliches() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (28): briefBlock(), buildCadence(), ChatOpts, criticPass(), fillToCadence(), formatRepair(), group(), harvestThresholdFor() (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (27): barsForTrack(), base64ToBlob(), blobToBase64(), Bundle, deleteBlob(), deleteTrack(), downloadBundle(), estimateStorage() (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (21): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Avatar (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (17): BarLocalState, BarProposal, BarSlice, BarVersion, bulkKey(), BulkOpts, BulkPersist, DEFAULT_BULK_OPTS (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (22): cn(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay (+14 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, fake-indexeddb (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (19): ReferencesPage(), BarDiff(), diffWords(), tokenize(), buildFingerprint(), loadFingerprints(), removeFingerprint(), saveFingerprints() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (17): hashBlob(), hashInputs(), sha256Hex(), keyFor(), chatInBrowser(), getModelId(), getWhisperModelId(), InBrowserEmbedConfig (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (13): LibraryPage(), SortKey, StatusFilter, EmptyState(), EmptyStateProps, RhymeLookup(), isLocalOnly(), rhymeWaveUrl() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (17): CachePanel(), LABELS, approxBytes(), cacheGet(), CacheNamespace, CacheRecord, cacheSet(), cacheStats (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (14): callCloud(), callLocal(), cosineSim(), EmbedBackend, EmbedContext, embeddingsAvailable(), embedMany(), embedOne() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (13): ensureCmudictLoaded(), findRhymes(), findRhymesBySound(), getAllPhonemes(), getLastStressedVowel(), getRhymeEnding(), getVowelPhonemes(), getWordInfo() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (13): findRhymesWithPos(), MetaphorBlueprint, SENSORY_BANKS, synthesizeMetaphors(), GENERIC_LADDERS, HINGLISH_LADDERS, KANGLISH_LADDERS, RhymeLadderBar (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (12): ATTITUDES, GENRES, REGIONS, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (12): CmudictRhymeHit, cmudictLookup(), customLookup(), datamuse(), DatamuseHit, datamuseLookup(), lookupRhymes(), RhymeHit (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (6): BarRow, AudioWaveform(), AudioWaveformProps, MetronomeRing(), MetronomeRingProps, Slider

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (7): LovableErrorOptions, LovableEvents, reportLovableError(), Window, ErrorComponent(), Toaster(), ToasterProps

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (8): LiveCapture, LiveCaptureOpts, playClick(), State, blobToBase64(), encodeWav(), rms(), writeString()

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (12): LocalBrief, LocalCadence, LocalLyrics, LocalPipelineResult, LocalQuality, ENGLISH_PATTERNS, generateOfflineRagLyrics(), getRegionalAdlib() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (12): downloadBlob(), escapeHtml(), flatLines(), Lyrics, openPrintWindow(), slugify(), toGeniusMarkdown(), toPlainText() (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.26
Nodes (11): ConnectPage(), defaultContext(), detectModel(), IterationBudget, LocalFamily, LocalProfile, LocalTier, preferredFormat() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (7): BarTimelineProps, SOURCE_LABELS, BarVersion, Badge(), BadgeProps, badgeVariants, TooltipContent

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): groups, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (10): CalibrateOpts, calibrateWithRetry(), clearCalibratedLatencyMs(), detectPeaks(), LatencyResult, loadCalibratedLatencyMs(), measureMicLatencyMs(), mergeChunks() (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (10): CommitBar, CommitInput, commitLiveTake, DeviceId, GenerateBarInput, generateLiveBar, StyleBriefSchema, transcribeBar (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (8): KeyboardShortcutsOverlay(), LocalStatusPill(), ShortcutDef, SHORTCUTS, useShortcuts(), AppShell(), NAV_ITEMS, Route

### Community 40 - "Community 40"
Cohesion: 0.27
Nodes (5): DictEntry, HINDI_DICTIONARY, DictEntry, KANNADA_DICTIONARY, WordMatch

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (10): scripts, build, build:dev, dev, format, lint, preview, start (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.38
Nodes (9): build_hindi_dataset(), build_kannada_dataset(), clean_definition(), count_syllables(), extract_multi_rime(), extract_rime(), main(), normalize_romanization() (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 47 - "Community 47"
Cohesion: 0.46
Nodes (6): clearBarHistory(), getBarHistory(), getLatestBarVersion(), loadAll(), recordBarVersion(), saveAll()

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): name, private, sideEffects, type

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (3): FEATURES, Route, STEPS

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (3): BpmResult, detectBpm(), snapBpm()

## Knowledge Gaps
- **441 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+436 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 12` to `Community 0`, `Community 1`, `Community 5`, `Community 10`, `Community 11`, `Community 16`, `Community 23`, `Community 24`, `Community 26`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 38`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 48`, `Community 49`, `Community 50`, `Community 53`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 16` to `Community 0`, `Community 1`, `Community 34`, `Community 5`, `Community 39`, `Community 11`, `Community 12`, `Community 17`, `Community 52`, `Community 26`, `Community 30`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `getAdmin()` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _441 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06713286713286713 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03278688524590164 - nodes in this community are weakly interconnected._
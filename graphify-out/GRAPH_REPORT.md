# Graph Report - .  (2026-08-18)

## Corpus Check
- 162 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1048 nodes · 2191 edges · 54 communities (50 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 70 edges
2. `Button` - 31 edges
3. `loadStyleMemory()` - 24 edges
4. `Badge()` - 23 edges
5. `runLocalPipeline()` - 22 edges
6. `cacheSet()` - 21 edges
7. `Card` - 20 edges
8. `getProvider()` - 20 edges
9. `endRhymeKey()` - 19 edges
10. `hashInputs()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `transcribeAudio()` --calls--> `fetch()`  [INFERRED]
  src/lib/ai-gateway.server.ts → src/server.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (54 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (77): ConnectPage(), SettingsPage(), LocalStatusPill(), Status, LlmScanPanel(), LlmScanPanelProps, WhisperScanPanel(), WhisperScanPanelProps (+69 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (72): DictEntry, HINDI_DICTIONARY, DictEntry, KANNADA_DICTIONARY, findRhymesWithPos(), getHindiDictSync(), getKannadaDictSync(), getWordMetadata() (+64 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (62): encodeWav(), writeString(), ReferencesPage(), ImportMergeDialog(), cosineSim(), EmbedContext, loadFingerprints(), removeFingerprint() (+54 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (62): CachePanel(), LABELS, RhymeLookup(), approxBytes(), cacheGet(), CacheNamespace, CacheRecord, cacheSet() (+54 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (40): downloadBlob(), escapeHtml(), flatLines(), Lyrics, openPrintWindow(), slugify(), toGeniusMarkdown(), toPlainText() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (31): BarRow, AudioWaveform(), AudioWaveformProps, MetronomeRing(), MetronomeRingProps, ATTITUDES, GENRES, REGIONS (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (28): consumeLastCapturedError(), renderErrorPage(), lovable, lovableAuth, SignInOptions, fetch(), getServerEntry(), normalizeCatastrophicSsrResponse() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (36): useIsMobile(), Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (26): Strategy, groups, KeyboardShortcutsOverlay(), NotificationCenter(), NotificationContext, NotificationContextType, NotificationItem, NotificationProvider() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (36): BarRewriteInput, briefToPromptBlock(), buildCadenceMap(), CadenceMapSchema, coerceLyrics(), CreateTrackInput, DeviceId, editorPass() (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (23): BarPocketItem, COLOR_PALETTE, PocketGrid(), PocketGridProps, heuristicCadence(), splitBars(), CadenceBar, CLICHES (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (18): cn(), ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), HoverCardContent, labelVariants, Pagination() (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (20): getRouter(), AppConnectRoute, AppLibraryRoute, AppLiveRoute, AppNewRoute, AppOnboardingRoute, AppReferencesRoute, AppRoute (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (19): barsForTrack(), base64ToBlob(), blobToBase64(), Bundle, downloadBundle(), estimateStorage(), exportBundle(), getBlob() (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (13): BarLocalState, BarSlice, bulkKey(), BulkPersist, loadBulk(), Lyrics, saveBulk(), trackSearchSchema (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.21
Nodes (15): BarDiff(), diffWords(), tokenize(), buildFingerprint(), fingerprintToConstraints(), SLANG_HINTS, endNuclei(), G2P (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (17): createLovableGateway(), transcribeAudio(), BarRewriteOptions, BarRewriteSchema, briefBlock(), callCriticGemini(), CouncilVerdict, CriticResponseSchema (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (17): discoverLlmBackends(), discoverWhisperBackends(), fetchTimeout(), getOllamaContextLength(), listOllamaModels(), listOpenAIModels(), LLM_CANDIDATES, LlmBackend (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (10): BarTimelineProps, SOURCE_LABELS, BarVersion, clearBarHistory(), getBarHistory(), getLatestBarVersion(), loadAll(), recordBarVersion() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (7): LovableErrorOptions, LovableEvents, reportLovableError(), Window, ErrorComponent(), Toaster(), ToasterProps

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (9): LibraryPage(), SortKey, StatusFilter, EmptyState(), EmptyStateProps, getDeviceId(), isLocalOnly(), deleteTrack (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (11): CommitBar, CommitInput, commitLiveTake, DeviceId, GenerateBarInput, generateLiveBar, StyleBriefSchema, transcribeBar (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (11): Route, Route, Route, Route, Route, Route, Route, Route (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (8): deleteBlob(), deleteTrack(), getTrack(), LocalTrack, openDb(), putBar(), putTrack(), tx()

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (5): Props, QualityRadar(), TrackQuality, TrackScorecard(), TrackScorecardProps

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 36 - "Community 36"
Cohesion: 0.43
Nodes (5): FxName, getCtx(), isSoundFxEnabled(), playFx(), playTone()

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (3): FEATURES, Route, STEPS

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): BpmResult, detectBpm(), snapBpm()

### Community 45 - "Community 45"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **336 isolated node(s):** `BUDGET_ANALYZE_MS`, `BUDGET_RENDER_MS`, `BUDGET_TOGGLE_MS`, `BUDGET_STRATEGY_MS`, `STRESS_N` (+331 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 18`, `Community 19`, `Community 21`, `Community 24`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 31`, `Community 33`, `Community 34`, `Community 35`, `Community 37`, `Community 39`, `Community 41`, `Community 42`, `Community 45`, `Community 46`, `Community 48`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 8` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 39`, `Community 40`, `Community 10`, `Community 11`, `Community 19`, `Community 22`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 0` to `Community 32`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 39`, `Community 8`, `Community 40`, `Community 7`, `Community 11`, `Community 14`, `Community 19`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `BUDGET_ANALYZE_MS`, `BUDGET_RENDER_MS`, `BUDGET_TOGGLE_MS` to the rest of the system?**
  _336 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.058767319636884856 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0506155950752394 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.054069938289744345 - nodes in this community are weakly interconnected._
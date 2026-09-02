// Unified Rhyme, Doppelreim & Bilingual Language Explorer
// Upgraded from VibeLyrics with multi-syllabic Doppelreim matching,
// flow-aligned cadence sorting, and 31k+ bilingual Kannada/Hinglish dictionary search.

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Music2,
  ExternalLink,
  Loader2,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  Activity,
  ArrowRight,
} from "lucide-react";
import { lookupRhymes, rhymeWaveUrl, type RhymeHit } from "@/lib/rhymes";
import {
  searchDoppelreim,
  type DoppelreimResult,
  type LanguageCode,
} from "@/lib/cadence-flow";
import { KANNADA_DICTIONARY, type DictEntry } from "@/lib/data/kannada-dict";
import { HINDI_DICTIONARY } from "@/lib/data/hindi-dict";
import { normalizeIndicWord } from "@/lib/indic-romanizer";

export type RhymeLookupProps = {
  trigger?: React.ReactNode;
  defaultWord?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectWord?: (word: string) => void;
  targetSyllables?: number;
  targetStress?: string;
};

export function RhymeLookup({
  trigger,
  defaultWord = "",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSelectWord,
  targetSyllables,
  targetStress,
}: RhymeLookupProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [activeTab, setActiveTab] = useState<"doppelreim" | "bilingual" | "quick">("quick");

  // Doppelreim state
  const [word, setWord] = useState(defaultWord);
  const [lang, setLang] = useState<LanguageCode>("auto");
  const [flowAligned, setFlowAligned] = useState(Boolean(targetSyllables || targetStress));
  const [doppelResults, setDoppelResults] = useState<DoppelreimResult[]>([]);

  // Bilingual Dictionary state
  const [dictQuery, setDictQuery] = useState("");
  const [dictResults, setDictResults] = useState<DictEntry[]>([]);

  // Quick Rhymes state
  const [quickHits, setQuickHits] = useState<RhymeHit[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickErr, setQuickErr] = useState<string | null>(null);

  useEffect(() => {
    if (defaultWord) {
      setWord(defaultWord);
      setActiveTab("quick");
      runDoppelreim(defaultWord, lang, flowAligned);
      runQuickRhymes(defaultWord);
    }
  }, [defaultWord]);

  // Keep flowAligned in sync if target props change
  useEffect(() => {
    if (targetSyllables || targetStress) {
      setFlowAligned(true);
    }
  }, [targetSyllables, targetStress]);

  function runDoppelreim(q: string, selectedLang: LanguageCode, isFlowAligned: boolean) {
    if (!q.trim()) {
      setDoppelResults([]);
      return;
    }
    const res = searchDoppelreim(q, {
      language: selectedLang,
      flowAligned: isFlowAligned,
      targetSyllables,
      targetStress,
      maxResults: 45,
    });
    setDoppelResults(res);
  }

  async function runQuickRhymes(w: string) {
    const q = w.trim();
    if (!q) return;
    setQuickLoading(true);
    setQuickErr(null);
    try {
      const out = await lookupRhymes(q);
      setQuickHits(out);
    } catch (e) {
      setQuickErr(e instanceof Error ? e.message : String(e));
    } finally {
      setQuickLoading(false);
    }
  }

  function handleDictSearch(query: string) {
    setDictQuery(query);
    const clean = normalizeIndicWord(query).toLowerCase();
    if (!clean || clean.length < 2) {
      setDictResults([]);
      return;
    }

    const matches: DictEntry[] = [];
    const all = [...KANNADA_DICTIONARY, ...HINDI_DICTIONARY];

    for (const item of all) {
      if (!item.word) continue;
      const w = item.word.toLowerCase();
      const m = (item.meaning || "").toLowerCase();

      if (w.startsWith(clean) || w === clean || m.includes(clean)) {
        matches.push(item);
        if (matches.length >= 30) break;
      }
    }
    setDictResults(matches);
  }

  function handleSelectDictWord(dictWord: string) {
    setWord(dictWord);
    setActiveTab("quick");
    runQuickRhymes(dictWord);
  }

  const groupedQuick = useMemo(() => {
    const g: Record<string, RhymeHit[]> = { perfect: [], near: [], "sound-like": [], related: [] };
    for (const h of quickHits) (g[h.kind] ??= []).push(h);
    for (const k of Object.keys(g)) g[k].sort((a, b) => b.score - a.score);
    return g;
  }, [quickHits]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Music2 className="h-4 w-4 mr-1.5" /> Rhyme Studio
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-display font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Doppelreim & Rhyme Studio
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pt-3 border-b bg-muted/20">
            <TabsList className="grid grid-cols-3 w-full max-w-md h-8">
              <TabsTrigger value="quick" className="text-xs gap-1.5">
                <Music2 className="h-3.5 w-3.5 text-blue-400" />
                Quick / RhymeWave
              </TabsTrigger>
              <TabsTrigger value="doppelreim" className="text-xs gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Doppelreim
              </TabsTrigger>
              <TabsTrigger value="bilingual" className="text-xs gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                Bilingual Dict
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Doppelreim & Flow-Aligned */}
          <TabsContent value="doppelreim" className="flex-1 flex flex-col p-4 gap-3 overflow-hidden m-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  autoFocus
                  placeholder="Enter word to find multi-syllable rhymes…"
                  value={word}
                  onChange={(e) => {
                    setWord(e.target.value);
                    runDoppelreim(e.target.value, lang, flowAligned);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runDoppelreim(word, lang, flowAligned);
                  }}
                  className="font-medium text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => runDoppelreim(word, lang, flowAligned)}
                  disabled={!word.trim()}
                >
                  Search
                </Button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 shrink-0">
                {(["auto", "en", "kn", "hi"] as const).map((lCode) => (
                  <Button
                    key={lCode}
                    size="sm"
                    variant={lang === lCode ? "default" : "outline"}
                    className="h-9 px-2.5 text-xs font-mono uppercase"
                    onClick={() => {
                      setLang(lCode);
                      runDoppelreim(word, lCode, flowAligned);
                    }}
                  >
                    {lCode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Flow-Aligned Cadence Filter Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                <Label htmlFor="flow-toggle" className="cursor-pointer font-medium">
                  Flow-Aligned Cadence Ranking
                </Label>
                {(targetSyllables || targetStress) && (
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 ml-1">
                    Target: {targetSyllables ?? "?"} syl {targetStress && `· ${targetStress}`}
                  </Badge>
                )}
              </div>
              <Switch
                id="flow-toggle"
                checked={flowAligned}
                onCheckedChange={(checked) => {
                  setFlowAligned(checked);
                  runDoppelreim(word, lang, checked);
                }}
              />
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-auto space-y-2 pr-1 min-h-[220px]">
              {doppelResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs space-y-1">
                  <Activity className="h-8 w-8 text-muted-foreground/40 mb-1" />
                  <p>Type a word above to explore multi-syllabic Doppelreim rhymes.</p>
                  <p className="text-[11px] opacity-70">
                    Supports English cadence, Romanized Kanglish, and Hinglish rap vocabulary.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doppelResults.map((item, idx) => {
                    const matchBadge = {
                      "exact-multi": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      "vowel-resonance": "bg-primary/15 text-primary border-primary/30",
                      rime: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                      slant: "bg-muted text-muted-foreground border-border",
                    }[item.matchType];

                    return (
                      <div
                        key={`${item.word}-${idx}`}
                        onClick={() => {
                          onSelectWord?.(item.word);
                          if (onSelectWord) setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60 hover:bg-background hover:border-primary/50 transition-all ${
                          onSelectWord ? "cursor-pointer group" : ""
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {item.word}
                            </span>
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-muted/60 text-muted-foreground">
                              {item.language}
                            </span>
                          </div>
                          {item.meaning && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {item.meaning}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.syllables}s
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${matchBadge}`}>
                              {item.matchType === "exact-multi" ? "multi" : item.matchType}
                            </span>
                          </div>
                          {item.stressPattern && (
                            <div className="flex items-center gap-0.5 font-mono text-[8px]" title={`Stress: ${item.stressPattern}`}>
                              {item.stressPattern.split("").map((c, i) => (
                                <span key={i} className={c === "/" ? "text-primary font-bold" : "text-muted-foreground/60"}>
                                  {c === "/" ? "●" : "○"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: Bilingual Dictionary */}
          <TabsContent value="bilingual" className="flex-1 flex flex-col p-4 gap-3 overflow-hidden m-0">
            <div className="flex gap-2">
              <Input
                placeholder="Search Kannada or Hindi rap word (e.g. huduga, sapna, bangaara)..."
                value={dictQuery}
                onChange={(e) => handleDictSearch(e.target.value)}
                className="font-medium text-sm"
              />
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-1 min-h-[220px]">
              {dictResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs space-y-1">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-1" />
                  <p>Search over 31,000+ Romanized Kannada and Hindi dictionary terms.</p>
                  <p className="text-[11px] opacity-70">
                    Discover poetic translations, vowel sequences, and jump directly into rhyming.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dictResults.map((entry, idx) => (
                    <div
                      key={`${entry.word}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60 hover:bg-background/90 transition-all text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {entry.word}
                          </span>
                          {entry.pos && (
                            <Badge variant="outline" className="text-[9px] font-mono uppercase">
                              {entry.pos}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-[10px] font-mono">
                            {entry.syllables} syl
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">{entry.meaning}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectDictWord(entry.word)}
                        className="h-7 text-[11px] gap-1 shrink-0"
                      >
                        Rhymes <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Quick Rhymes & RhymeWave */}
          <TabsContent value="quick" className="flex-1 flex flex-col p-4 gap-3 overflow-hidden m-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a word for fast phonetic lookup…"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  runQuickRhymes(e.target.value);
                }}
                className="font-medium text-sm"
              />
              <Button size="sm" onClick={() => runQuickRhymes(word)} disabled={quickLoading || !word.trim()}>
                {quickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
              </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-1 text-sm min-h-[220px]">
              {quickErr && <div className="text-destructive text-xs">{quickErr}</div>}
              {!quickHits.length && !quickLoading && !quickErr && (
                <div className="text-xs text-muted-foreground">
                  Enter a word to see perfect, near, and sound-alike rhymes powered by Datamuse.
                </div>
              )}
              {(["perfect", "near", "sound-like", "related"] as const).map((k) =>
                groupedQuick[k]?.length ? (
                  <div key={k}>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-1">
                      {k}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedQuick[k].slice(0, 30).map((h) => (
                        <Badge
                          key={`${k}-${h.word}`}
                          variant="secondary"
                          className={`font-mono text-xs ${
                            onSelectWord ? "cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors" : ""
                          }`}
                          onClick={() => {
                            onSelectWord?.(h.word);
                            if (onSelectWord) setIsOpen(false);
                          }}
                        >
                          {h.word}
                          {h.syllables ? <span className="opacity-60 ml-1">·{h.syllables}</span> : null}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-xs">
              <span className="text-[10px] text-muted-foreground">Datamuse · local cache</span>
              <a
                href={rhymeWaveUrl(word || "flow")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open in RhymeWave <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

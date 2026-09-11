import { useEffect, useState, useMemo } from "react";
import { lookupRhymes, type RhymeHit, type RhymeKind } from "@/lib/rhymes";
import { generateAiRhymes } from "@/lib/ai-rhymes";
import { Badge } from "@/components/ui/badge";
import { Zap, Music, ExternalLink, Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineRhymeDockProps {
  targetWord: string;
  onSelectWord: (word: string) => void;
  className?: string;
}

type TabType = "all" | "ai" | "perfect" | "near" | "multisyllable";

export function InlineRhymeDock({
  targetWord,
  onSelectWord,
  className,
}: InlineRhymeDockProps) {
  const [hits, setHits] = useState<RhymeHit[]>([]);
  const [aiHits, setAiHits] = useState<RhymeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [lastInsertedWord, setLastInsertedWord] = useState<string | null>(null);

  const cleanWord = useMemo(() => {
    return targetWord.replace(/[^a-zA-Z0-9'-]/g, "").trim().toLowerCase();
  }, [targetWord]);

  useEffect(() => {
    if (!cleanWord || cleanWord.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    lookupRhymes(cleanWord)
      .then((res: RhymeHit[]) => {
        if (!cancelled) {
          setHits(res);
        }
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cleanWord]);

  useEffect(() => {
    if (activeTab === "ai" && cleanWord && cleanWord.length >= 2) {
      setAiLoading(true);
      generateAiRhymes(cleanWord)
        .then((res) => {
          const items: RhymeHit[] = [];
          for (const grp of res.groups) {
            for (const it of grp.items) {
              items.push({
                word: it.word,
                score: grp.category === "multi" ? 95 : 85,
                kind: grp.category === "multi" ? "perfect" : "near",
                syllables: it.syllables,
              });
            }
          }
          setAiHits(items);
        })
        .catch(() => setAiHits([]))
        .finally(() => setAiLoading(false));
    }
  }, [cleanWord, activeTab]);

  const filteredHits = useMemo(() => {
    if (activeTab === "ai") return aiHits;
    if (activeTab === "all") return hits.slice(0, 36);
    if (activeTab === "perfect") return hits.filter((h) => h.kind === "perfect").slice(0, 36);
    if (activeTab === "near") return hits.filter((h) => h.kind === "near" || h.kind === "sound-like").slice(0, 36);
    if (activeTab === "multisyllable") return hits.filter((h) => (h.syllables || 1) >= 2).slice(0, 36);
    return hits.slice(0, 36);
  }, [hits, aiHits, activeTab]);

  const handleChipClick = (word: string) => {
    onSelectWord(word);
    setLastInsertedWord(word);
    setTimeout(() => setLastInsertedWord(null), 1500);
  };

  const rhymeWaveUrl = cleanWord ? `https://www.rhymewave.com/#/${encodeURIComponent(cleanWord)}` : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card/70 p-2.5 sm:p-3 space-y-2.5 shadow-sm backdrop-blur-sm transition-all max-w-full overflow-hidden",
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 shrink-0">
            <Zap className="h-3 w-3" />
          </div>
          <span className="text-xs font-mono font-semibold text-foreground truncate">
            Inline Rhyme Dock
          </span>
          {cleanWord ? (
            <Badge
              variant="outline"
              className="text-[11px] font-mono font-bold bg-primary/10 text-primary border-primary/30 truncate max-w-[100px] sm:max-w-none"
            >
              &quot;{cleanWord}&quot;
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground italic hidden sm:inline">
              (type or click any bar to explore)
            </span>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
        </div>

        {/* Filter categories & RhymeWave link */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {cleanWord && (
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md text-[10px] font-medium border border-border/40 overflow-x-auto no-scrollbar">
              {(["all", "ai", "perfect", "near", "multisyllable"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2 py-0.5 rounded transition-all cursor-pointer capitalize shrink-0 flex items-center gap-1",
                    activeTab === tab
                      ? tab === "ai"
                        ? "bg-purple-600 text-white shadow-xs font-semibold"
                        : "bg-background text-foreground shadow-xs font-semibold"
                      : tab === "ai"
                        ? "text-purple-400 hover:text-purple-300 font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "ai" && <Sparkles className="h-2.5 w-2.5" />}
                  {tab === "ai" ? "AI Rhymes" : tab === "multisyllable" ? "Multi (2+)" : tab}
                </button>
              ))}
            </div>
          )}

          {rhymeWaveUrl && (
            <a
              href={rhymeWaveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-amber-400 transition-colors px-1.5 py-0.5 rounded border border-border/40 hover:border-amber-500/30 shrink-0"
              title="Open full phonetic tree in RhymeWave"
            >
              <span>RhymeWave</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Rhyme Chips Shelf */}
      {cleanWord ? (
        filteredHits.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto overflow-x-hidden studio-scroll p-0.5">
            {filteredHits.map((h, i) => {
              const isJustInserted = lastInsertedWord === h.word;
              return (
                <button
                  key={`${h.word}-${i}`}
                  type="button"
                  onClick={() => handleChipClick(h.word)}
                  title={`Click to insert "${h.word}" into active line (${h.kind})`}
                  className={cn(
                    "group flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer active:scale-95 shrink-0 max-w-full",
                    isJustInserted
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105"
                      : h.kind === "perfect"
                        ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20 hover:border-primary/50"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 border-border/50",
                  )}
                >
                  <span className="truncate max-w-[130px] sm:max-w-none">{h.word}</span>
                  {h.syllables && (
                    <span className="text-[9px] font-mono opacity-50">
                      {h.syllables}s
                    </span>
                  )}
                  <Plus className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              );
            })}
          </div>
        ) : activeTab === "ai" && aiLoading ? (
          <div className="text-[11px] text-purple-400 font-mono py-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
            <span>Consulting Unsloth AI ghostwriter for &quot;{cleanWord}&quot; rhymes…</span>
          </div>
        ) : loading ? (
          <div className="text-[11px] text-muted-foreground font-mono py-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Scanning Datamuse &amp; CMUdict rhyming dictionary for &quot;{cleanWord}&quot;…</span>
          </div>
        ) : activeTab === "ai" ? (
          <div className="text-[11px] text-muted-foreground italic py-1 flex items-center gap-2">
            <span>No AI rhymes generated yet for &quot;{cleanWord}&quot;.</span>
            <button
              type="button"
              onClick={() => {
                setAiLoading(true);
                generateAiRhymes(cleanWord)
                  .then((res) => {
                    const items: RhymeHit[] = [];
                    for (const grp of res.groups) {
                      for (const it of grp.items) {
                        items.push({
                          word: it.word,
                          score: 90,
                          kind: "perfect",
                          syllables: it.syllables,
                        });
                      }
                    }
                    setAiHits(items);
                  })
                  .finally(() => setAiLoading(false));
              }}
              className="text-purple-400 hover:underline cursor-pointer font-medium"
            >
              Generate AI Rhymes
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground italic py-1">
            No direct rhymes found for &quot;{cleanWord}&quot;. Try clicking word in the right phonetic panel or opening RhymeWave.
          </div>
        )
      ) : (
        <div className="text-[11px] text-muted-foreground py-1 flex items-center gap-1.5 font-mono">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Place cursor on any bar to see instant 1-click rhymes and multisyllables here.</span>
        </div>
      )}
    </div>
  );
}

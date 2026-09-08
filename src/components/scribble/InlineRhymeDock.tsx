import React, { useEffect, useState, useMemo } from "react";
import { getRhymes, type RhymeHit, type RhymeKind } from "@/lib/rhymes";
import { Badge } from "@/components/ui/badge";
import { Zap, Music, ExternalLink, Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineRhymeDockProps {
  targetWord: string;
  onSelectWord: (word: string) => void;
  className?: string;
}

type TabType = "all" | "perfect" | "near" | "multisyllable";

export function InlineRhymeDock({
  targetWord,
  onSelectWord,
  className,
}: InlineRhymeDockProps) {
  const [hits, setHits] = useState<RhymeHit[]>([]);
  const [loading, setLoading] = useState(false);
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

    getRhymes(cleanWord)
      .then((res) => {
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

  const filteredHits = useMemo(() => {
    if (activeTab === "all") return hits.slice(0, 36);
    if (activeTab === "perfect") return hits.filter((h) => h.kind === "perfect").slice(0, 36);
    if (activeTab === "near") return hits.filter((h) => h.kind === "near" || h.kind === "sound-like").slice(0, 36);
    if (activeTab === "multisyllable") return hits.filter((h) => (h.syllables || 1) >= 2).slice(0, 36);
    return hits.slice(0, 36);
  }, [hits, activeTab]);

  const handleChipClick = (word: string) => {
    onSelectWord(word);
    setLastInsertedWord(word);
    setTimeout(() => setLastInsertedWord(null), 1500);
  };

  const rhymeWaveUrl = cleanWord ? `https://www.rhymewave.com/#/${encodeURIComponent(cleanWord)}` : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card/70 p-3 space-y-2.5 shadow-sm backdrop-blur-sm transition-all",
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/15 text-amber-400">
            <Zap className="h-3 w-3" />
          </div>
          <span className="text-xs font-mono font-semibold text-foreground">
            Inline Rhyme Dock
          </span>
          {cleanWord ? (
            <Badge
              variant="outline"
              className="text-[11px] font-mono font-bold bg-primary/10 text-primary border-primary/30"
            >
              &quot;{cleanWord}&quot;
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">
              (type or click any bar to explore)
            </span>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        {/* Filter categories & RhymeWave link */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {cleanWord && hits.length > 0 && (
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md text-[10px] font-medium border border-border/40">
              {(["all", "perfect", "near", "multisyllable"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2 py-0.5 rounded transition-all cursor-pointer capitalize",
                    activeTab === tab
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "multisyllable" ? "Multi (2+)" : tab}
                </button>
              ))}
            </div>
          )}

          {rhymeWaveUrl && (
            <a
              href={rhymeWaveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-amber-400 transition-colors px-1.5 py-0.5 rounded border border-border/40 hover:border-amber-500/30"
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
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto studio-scroll p-0.5">
            {filteredHits.map((h, i) => {
              const isJustInserted = lastInsertedWord === h.word;
              return (
                <button
                  key={`${h.word}-${i}`}
                  type="button"
                  onClick={() => handleChipClick(h.word)}
                  title={`Click to insert "${h.word}" into active line (${h.kind})`}
                  className={cn(
                    "group flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer active:scale-95",
                    isJustInserted
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105"
                      : h.kind === "perfect"
                        ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20 hover:border-primary/50"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 border-border/50",
                  )}
                >
                  <span>{h.word}</span>
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
        ) : loading ? (
          <div className="text-[11px] text-muted-foreground font-mono py-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Scanning Datamuse & CMUdict rhyming dictionary for &quot;{cleanWord}&quot;…</span>
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

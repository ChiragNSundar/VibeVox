import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Music, Copy, Check, FolderSync, CheckCircle2, ArrowRight, Printer, FileText } from "lucide-react";
import { countSyllables } from "@/lib/phonetics";
import type { ScribbleResult } from "@/lib/scribble-synthesizer";

interface ScribbleResultViewProps {
  result: ScribbleResult;
  resultHighlighted: Array<{ html?: string; schemeLetter?: string; rhymeGroupClass?: string }>;
  copied: boolean;
  onCopy: () => void;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  syncedPaths: { lyricsPath?: string; rhymesPath?: string } | null;
  onManualSync: () => void;
  onSendToStudio: () => void;
  onWordClick: (word: string) => void;
}

export function ScribbleResultView({
  result,
  resultHighlighted,
  copied,
  onCopy,
  onExportPdf,
  onExportWord,
  syncedPaths,
  onManualSync,
  onSendToStudio,
  onWordClick,
}: ScribbleResultViewProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* Sense-Making Executive Card */}
      <Card className="p-4 space-y-3 bg-card/80 border-emerald-500/40 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold font-display">{result.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {result.analysis.centralNarrative}
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono shrink-0">
            ~{result.analysis.suggestedBpm} BPM
          </Badge>
        </div>

        {/* Mood & Vibe Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="text-[10px]">
            Mood: {result.analysis.mood}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Genre: {result.analysis.genre}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Vibe: {result.analysis.vibe}
          </Badge>
        </div>

        {/* Standout Gems */}
        {result.analysis.standoutGems.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> Extracted Standout Gems:
            </div>
            <div className="space-y-1">
              {result.analysis.standoutGems.map((gem, i) => (
                <div key={i} className="text-xs font-mono p-1.5 rounded bg-background/60 border border-border/40 text-foreground italic">
                  &quot;{gem}&quot;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rhyme Pockets */}
        {result.analysis.rhymeClusters.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" /> Discovered Rhyme Pockets:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.analysis.rhymeClusters.map((cluster, i) => (
                <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border/60 break-words max-w-full">
                  <strong className="text-primary">{cluster.word}</strong> ↔ {cluster.rhymesWith.join(", ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Synthesized Lyrics Section */}
      <Card className="p-3 sm:p-4 space-y-4 border-border/80 bg-card/60 max-w-full overflow-hidden">
        <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Music className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">Synthesized Lyric Blueprint</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onExportPdf && (
              <Button size="sm" variant="outline" onClick={onExportPdf} className="h-7 text-xs gap-1 border-purple-500/40 text-purple-300 hover:text-purple-200">
                <Printer className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
            {onExportWord && (
              <Button size="sm" variant="outline" onClick={onExportWord} className="h-7 text-xs gap-1 border-blue-500/40 text-blue-300 hover:text-blue-200">
                <FileText className="h-3.5 w-3.5" /> Word
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Lines Container */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden studio-scroll pr-1 font-mono text-sm leading-relaxed">
          {result.sections.map((sec, secIdx) => {
            const prevLinesCount = result.sections
              .slice(0, secIdx)
              .reduce((acc, s) => acc + s.lines.length, 0);

            return (
              <div key={secIdx} className="space-y-1.5">
                <div className="text-xs font-bold text-primary/80 uppercase tracking-wide px-2 py-0.5 rounded bg-primary/10 inline-block">
                  [{sec.type}]
                </div>
                <div className="space-y-1">
                  {sec.lines.map((line, lineIdx) => {
                    const globalIdx = prevLinesCount + lineIdx;
                    const highlighted = resultHighlighted[globalIdx];
                    const syllables = countSyllables(line);

                    return (
                      <div
                        key={lineIdx}
                        className="flex items-baseline justify-between gap-2 sm:gap-3 group px-2 py-1 rounded hover:bg-card/80 transition-colors max-w-full overflow-hidden"
                      >
                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                          {highlighted?.schemeLetter && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-border/40 shrink-0 self-center ${
                                highlighted.rhymeGroupClass || "text-muted-foreground bg-muted/20"
                              }`}
                            >
                              {highlighted.schemeLetter}
                            </span>
                          )}
                          <span
                            className="select-text cursor-pointer leading-relaxed text-sm font-medium break-words"
                            onClick={(e) => {
                              const target = (e.target as HTMLElement).closest(".word-hover") as HTMLElement | null;
                              if (target) {
                                const w = target.getAttribute("data-word") || target.textContent || "";
                                if (w.trim()) onWordClick(w.trim());
                              }
                            }}
                            dangerouslySetInnerHTML={{ __html: highlighted?.html || line }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground/70 shrink-0 font-mono">
                          {syllables} syl
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions & Brain Status */}
        <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
            {syncedPaths ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono truncate max-w-full" title={syncedPaths.lyricsPath}>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Synced to {syncedPaths.lyricsPath}</span>
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={onManualSync} className="text-xs">
                <FolderSync className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Save to Local Brain
              </Button>
            )}
          </div>

          <Button size="sm" onClick={onSendToStudio} className="text-xs bg-primary hover:bg-primary/90">
            Use in Track Studio <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

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
  onDismiss?: () => void;
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
  onDismiss,
}: ScribbleResultViewProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* Synthesized Lyrics Section */}
      <Card className="p-3 sm:p-4 space-y-4 border-border/80 bg-card/60 max-w-full overflow-hidden">
        <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                title="Return to live phonetic studio"
              >
                ← Back
              </Button>
            )}
            <Music className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">{result.title}</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono shrink-0">
              ~{result.analysis.suggestedBpm || 90} BPM
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onExportPdf && (
              <Button
                size="sm"
                variant="outline"
                onClick={onExportPdf}
                className="h-7 text-xs gap-1 border-purple-500/40 text-purple-300 hover:text-purple-200 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
            {onExportWord && (
              <Button
                size="sm"
                variant="outline"
                onClick={onExportWord}
                className="h-7 text-xs gap-1 border-blue-500/40 text-blue-300 hover:text-blue-200 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" /> Word
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 text-xs cursor-pointer">
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

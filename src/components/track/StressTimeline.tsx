import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, Activity } from "lucide-react";

export type StressTimelineProps = {
  pattern: string; // raw pattern, e.g. "x / x /" or "x/x/"
  overrides?: Record<number, "/" | "x">;
  onToggleNode: (index: number) => void;
  onResetOverrides?: () => void;
  syllableCount?: number;
};

export function StressTimeline({
  pattern,
  overrides = {},
  onToggleNode,
  onResetOverrides,
  syllableCount,
}: StressTimelineProps) {
  // Parse pattern into individual '/' and 'x' characters
  const baseChars = pattern.replace(/[^/x]/g, "").split("") as ("/" | "x")[];
  if (baseChars.length === 0) return null;

  const totalSyllables = syllableCount ?? baseChars.length;
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-md bg-card/60 backdrop-blur-sm border border-border/50 text-xs my-1 animate-in fade-in slide-in-from-top-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
          <Activity className="h-3 w-3 text-primary" />
          Flow
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {baseChars.map((originalChar, idx) => {
            const current = overrides[idx] || originalChar;
            const isStressed = current === "/";
            const isOverridden = overrides[idx] !== undefined;

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onToggleNode(idx)}
                    className={`h-5 w-5 rounded flex items-center justify-center font-mono text-xs transition-all duration-150 select-none ${
                      isStressed
                        ? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/20 hover:bg-primary/30"
                        : "bg-muted/40 text-muted-foreground border border-border/40 hover:bg-muted"
                    } ${isOverridden ? "ring-1 ring-amber-400/80" : ""}`}
                    title={`Syllable #${idx + 1}: ${isStressed ? "Stressed (/)" : "Unstressed (x)"}${isOverridden ? " [Overridden]" : ""} — Click to toggle`}
                  >
                    {isStressed ? "●" : "○"}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px] font-mono">
                  Syllable {idx + 1}: {isStressed ? "Stressed Pulse (/)" : "Unstressed (x)"}
                  {isOverridden && " • Manual Override"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-mono text-muted-foreground">
          {totalSyllables} syl
        </span>

        {hasOverrides && onResetOverrides && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetOverrides}
            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1"
            title="Reset stress overrides to detected pattern"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

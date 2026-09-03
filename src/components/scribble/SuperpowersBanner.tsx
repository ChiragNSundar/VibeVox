import React from "react";

export function SuperpowersBanner() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
      <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
        <span className="p-1 rounded bg-amber-500/10 text-amber-400 shrink-0 text-sm">💡</span>
        <div>
          <span className="font-semibold text-foreground block">Narrative Extraction</span>
          <span className="text-muted-foreground text-[10px] leading-tight block">Detects raw themes, mood & emotions</span>
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
        <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 shrink-0 text-sm">💎</span>
        <div>
          <span className="font-semibold text-foreground block">Gem Mining</span>
          <span className="text-muted-foreground text-[10px] leading-tight block">Preserves punchlines & standout bars</span>
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
        <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0 text-sm">⚡</span>
        <div>
          <span className="font-semibold text-foreground block">Cadence Lock</span>
          <span className="text-muted-foreground text-[10px] leading-tight block">6-channel DHH phonemes & pocket flow</span>
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
        <span className="p-1 rounded bg-purple-500/10 text-purple-400 shrink-0 text-sm">📁</span>
        <div>
          <span className="font-semibold text-foreground block">Brain Auto-Sync</span>
          <span className="text-muted-foreground text-[10px] leading-tight block">Zero-cloud local memory indexing</span>
        </div>
      </div>
    </div>
  );
}

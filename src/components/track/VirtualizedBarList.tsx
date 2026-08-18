// VirtualizedBarList — Virtualized list rendering for long track bar lists.
// Uses @tanstack/react-virtual when bar count > 30 to maintain 60 FPS performance.

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BarRow, type BarVersion, type BarProposal, type RewriteOpts } from "./BarRow";
import { countSyllables, endRhymeKey, type CadenceMap } from "@/lib/lyrics-analysis";

export type VirtualizedBarItem = {
  globalIndex: number;
  line: string;
  sectionType: string;
};

export type VirtualizedBarListProps = {
  items: VirtualizedBarItem[];
  cadence?: CadenceMap | null;
  localLocked: Record<number, boolean>;
  localProposal: Record<number, BarProposal | undefined>;
  localHistory: Record<number, BarVersion[]>;
  rewritingIdx: number | null;
  bulkPending: Set<number>;
  selectMode: boolean;
  selectedBars: Set<number>;
  focusedBar: number | null;
  badBarSet: Set<number>;
  onFocusBar: (idx: number) => void;
  onToggleSelectBar: (idx: number) => void;
  onRunBarRewrite: (idx: number, line: string, opts: RewriteOpts, mode: "replace" | "append") => void;
  onSelectAlternate: (idx: number, delta: number) => void;
  onAcceptProposal: (idx: number, line: string) => void;
  onRevertProposal: (idx: number) => void;
  onToggleLockBar: (idx: number) => void;
  onRestoreVersion: (idx: number, v: BarVersion, line: string) => void;
};

export function VirtualizedBarList({
  items,
  cadence,
  localLocked,
  localProposal,
  localHistory,
  rewritingIdx,
  bulkPending,
  selectMode,
  selectedBars,
  focusedBar,
  badBarSet,
  onFocusBar,
  onToggleSelectBar,
  onRunBarRewrite,
  onSelectAlternate,
  onAcceptProposal,
  onRevertProposal,
  onToggleLockBar,
  onRestoreVersion,
}: VirtualizedBarListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const isVirtualized = items.length > 30;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
    enabled: isVirtualized,
  });

  if (!isVirtualized) {
    // Plain rendering for short tracks
    let currentSection = "";
    return (
      <div className="space-y-6">
        {items.map((item) => {
          const idx = item.globalIndex;
          const bar = cadence?.bars[idx];
          const got = countSyllables(item.line);
          const gotEnd = endRhymeKey(item.line);
          const ok = bar ? Math.abs(bar.syllables - got) <= 1 : true;
          const locked = !!localLocked[idx];
          const proposal = localProposal[idx];
          const history = localHistory[idx] ?? [];

          const showHeader = item.sectionType !== currentSection;
          if (showHeader) currentSection = item.sectionType;

          return (
            <div key={idx}>
              {showHeader && (
                <div className="text-xs uppercase tracking-wider text-primary mb-2 mt-4 first:mt-0">
                  {item.sectionType}
                </div>
              )}
              <BarRow
                line={item.line}
                bar={bar}
                got={got}
                gotEnd={gotEnd}
                ok={ok}
                locked={locked}
                proposal={proposal}
                history={history}
                rewriting={rewritingIdx === idx || bulkPending.has(idx)}
                selectMode={selectMode}
                selected={selectedBars.has(idx)}
                focused={focusedBar === idx}
                repeatWarn={badBarSet.has(idx)}
                onFocus={() => onFocusBar(idx)}
                onToggleSelect={() => onToggleSelectBar(idx)}
                onRewrite={(opts) => onRunBarRewrite(idx, item.line, opts, "replace")}
                onMoreAlternates={(opts) => onRunBarRewrite(idx, item.line, opts, "append")}
                onSelectAlternate={(delta) => onSelectAlternate(idx, delta)}
                onAccept={() => onAcceptProposal(idx, item.line)}
                onRevert={() => onRevertProposal(idx)}
                onToggleLock={() => onToggleLockBar(idx)}
                onRestore={(v) => onRestoreVersion(idx, v, item.line)}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Virtualized rendering for long tracks (30+ bars)
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="max-h-[600px] overflow-y-auto pr-1 space-y-1 relative"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const item = items[virtualRow.index];
          const idx = item.globalIndex;
          const bar = cadence?.bars[idx];
          const got = countSyllables(item.line);
          const gotEnd = endRhymeKey(item.line);
          const ok = bar ? Math.abs(bar.syllables - got) <= 1 : true;
          const locked = !!localLocked[idx];
          const proposal = localProposal[idx];
          const history = localHistory[idx] ?? [];

          return (
            <div
              key={idx}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <BarRow
                line={item.line}
                bar={bar}
                got={got}
                gotEnd={gotEnd}
                ok={ok}
                locked={locked}
                proposal={proposal}
                history={history}
                rewriting={rewritingIdx === idx || bulkPending.has(idx)}
                selectMode={selectMode}
                selected={selectedBars.has(idx)}
                focused={focusedBar === idx}
                repeatWarn={badBarSet.has(idx)}
                onFocus={() => onFocusBar(idx)}
                onToggleSelect={() => onToggleSelectBar(idx)}
                onRewrite={(opts) => onRunBarRewrite(idx, item.line, opts, "replace")}
                onMoreAlternates={(opts) => onRunBarRewrite(idx, item.line, opts, "append")}
                onSelectAlternate={(delta) => onSelectAlternate(idx, delta)}
                onAccept={() => onAcceptProposal(idx, item.line)}
                onRevert={() => onRevertProposal(idx)}
                onToggleLock={() => onToggleLockBar(idx)}
                onRestore={(v) => onRestoreVersion(idx, v, item.line)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BarRow — individual bar row in the track lyrics editor.
// Extracted from track.$id.tsx for modularity and testability.

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2, Wand2, Lock, LockOpen, Check, X, History,
  ChevronLeft, ChevronRight, Plus, CheckSquare, Square,
  Pencil, Link2,
} from "lucide-react";
import { BarDiff } from "@/components/BarDiff";
import type { CadenceMap } from "@/lib/lyrics-analysis";

export type BarVersion = { text: string; ts: number; source: "original" | "rewrite" | "manual" };
export type RewriteOpts = { keepEndSound: boolean; swapMetaphor: boolean; raiseDensity: boolean; custom: string; count: number };
export type BarProposal = { original: string; proposals: string[]; selectedIdx: number };

export type BarRowProps = {
  line: string;
  bar: CadenceMap["bars"][number] | undefined;
  got: number;
  gotEnd: string;
  ok: boolean;
  locked: boolean;
  proposal: BarProposal | undefined;
  history: BarVersion[];
  rewriting: boolean;
  selectMode?: boolean;
  selected?: boolean;
  focused?: boolean;
  repeatWarn?: boolean;
  highlightedHtml?: string;
  schemeLetter?: string;
  rhymeGroupClass?: string;
  hasInternalRhyme?: boolean;
  onToggleSelect?: () => void;
  onFocus?: () => void;
  onRewrite: (opts: RewriteOpts) => void;
  onMoreAlternates: (opts: RewriteOpts) => void;
  onSelectAlternate: (delta: number) => void;
  onAccept: () => void;
  onRevert: () => void;
  onToggleLock: () => void;
  onRestore: (v: BarVersion) => void;
  onWordClick?: (word: string) => void;
  onUpdateLine?: (newLine: string) => void;
};

export function BarRow({
  line, bar, got, gotEnd, ok, locked, proposal, history, rewriting,
  selectMode = false, selected: barSelected = false, focused = false, repeatWarn = false,
  highlightedHtml, schemeLetter, rhymeGroupClass, hasInternalRhyme = false,
  onToggleSelect, onFocus,
  onRewrite, onMoreAlternates, onSelectAlternate, onAccept, onRevert, onToggleLock, onRestore,
  onWordClick, onUpdateLine,
}: BarRowProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(line);
  const [keepEndSound, setKeepEndSound] = useState(true);
  const [swapMetaphor, setSwapMetaphor] = useState(false);
  const [raiseDensity, setRaiseDensity] = useState(false);
  const [count, setCount] = useState(3);
  const [custom, setCustom] = useState("");
  const rowRef = useRef<HTMLDivElement | null>(null);
  const hoveredWordRef = useRef<string | null>(null);

  useEffect(() => {
    setEditText(line);
  }, [line]);

  useEffect(() => {
    if (focused && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focused]);

  const saveEdit = () => {
    setIsEditing(false);
    if (editText.trim() !== line && onUpdateLine) {
      onUpdateLine(editText.trim());
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(line);
  };

  const handleTextMouseMove = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLElement;
    const target = (e.target as HTMLElement).closest(".word-hover") as HTMLElement | null;

    container.querySelectorAll(".word-hover.hovered").forEach((el) => el.classList.remove("hovered"));

    if (target) {
      target.classList.add("hovered");
    }
  };

  const handleTextMouseLeave = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLElement;
    container.querySelectorAll(".word-hover.hovered").forEach((el) => el.classList.remove("hovered"));
  };

  const handleTextClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".word-hover") as HTMLElement | null;
    if (target) {
      const word = target.getAttribute("data-word") || target.textContent || "";
      if (word.trim()) {
        e.stopPropagation();
        onWordClick?.(word.trim());
      }
    }
  };

  const opts: RewriteOpts = { keepEndSound, swapMetaphor, raiseDensity, custom, count };
  const total = proposal?.proposals.length ?? 0;
  const selectedAlt = proposal?.proposals[proposal.selectedIdx] ?? "";
  const canSelect = selectMode && !locked && !!line.trim();

  return (
    <div
      ref={rowRef}
      className={`group rounded ${focused ? "outline outline-2 outline-primary/60 outline-offset-2" : ""}`}
      onClick={onFocus}
    >
      <div className="flex items-start gap-1.5">
        {selectMode && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (canSelect) onToggleSelect?.(); }}
            disabled={!canSelect}
            title={locked ? "Locked — unlock to include" : barSelected ? "Deselect" : "Select"}
            className="mt-1 mr-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 shrink-0"
          >
            {barSelected
              ? <CheckSquare className="h-4 w-4 text-primary" />
              : <Square className="h-4 w-4" />}
          </button>
        )}

        {schemeLetter && (
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-border/40 shrink-0 self-center cursor-default ${rhymeGroupClass ? rhymeGroupClass : "text-muted-foreground bg-muted/20"}`}
            title={`Rhyme Family: ${schemeLetter} (sound: ${gotEnd || "end"})`}
          >
            {schemeLetter}
          </span>
        )}

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
              className="flex-1 bg-background px-2 py-0.5 text-sm font-display rounded border border-primary/60 outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={saveEdit} title="Save" className="p-1 text-emerald-400 hover:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={cancelEdit} title="Cancel" className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onDoubleClick={() => setIsEditing(true)}
                onMouseMove={handleTextMouseMove}
                onMouseLeave={handleTextMouseLeave}
                onClick={handleTextClick}
                className={`flex-1 px-1 -mx-1 rounded select-text ${!ok ? "bg-amber-500/10" : ""} ${repeatWarn ? "border-b border-dashed border-amber-500/50" : ""} ${locked ? "border-l-2 border-primary/60 pl-2" : ""} ${barSelected ? "ring-1 ring-primary/40" : ""}`}
              >
                {highlightedHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                ) : (
                  line || <span className="text-muted-foreground italic">(silence)</span>
                )}
              </div>
            </TooltipTrigger>
            {bar && (
              <TooltipContent side="right" className="text-xs">
                <div>Target: <b>{bar.syllables}</b> syll · end <b>"{bar.endSound}"</b></div>
                <div>Got: <b>{got}</b> syll · end <b>"{gotEnd}"</b></div>
                {hasInternalRhyme && <div className="text-purple-400 mt-0.5">🔗 Contains internal rhyme</div>}
                <div className="text-muted-foreground mt-1">Mumble: "{bar.text}"</div>
                {repeatWarn && <div className="text-amber-400 mt-1">⚠ part of a repetition streak</div>}
                <div className="text-[10px] text-muted-foreground/80 mt-1">Double-click to edit · Click word to inspect rhymes</div>
              </TooltipContent>
            )}
          </Tooltip>
        )}

        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex shrink-0 items-center">
          {!isEditing && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              title="Edit bar (or double click line)"
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={onToggleLock}
            title={locked ? "Unlock (allow rewrite)" : "Lock (protect from rewrites)"}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          </button>

          {history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title={`${history.length} prior version${history.length === 1 ? "" : "s"}`}
                  className="p-1 text-muted-foreground hover:text-foreground relative"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-mono bg-primary/80 text-primary-foreground rounded-full h-3 min-w-3 px-0.5 leading-3 flex items-center justify-center">
                    {history.length}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider">Bar history</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history.map((v) => (
                  <DropdownMenuItem
                    key={v.ts}
                    onClick={() => onRestore(v)}
                    className="flex flex-col items-start gap-0.5 cursor-pointer"
                  >
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {v.source} · {new Date(v.ts).toLocaleTimeString()}
                    </div>
                    <div className="text-sm truncate w-full">{v.text}</div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={locked || rewriting}
                title={locked ? "Locked" : "Rewrite this bar"}
                className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30"
              >
                {rewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3" align="end">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rewrite this bar</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={keepEndSound} onCheckedChange={(v) => setKeepEndSound(!!v)} />
                  Keep end-sound ({bar?.endSound ?? "?"})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={swapMetaphor} onCheckedChange={(v) => setSwapMetaphor(!!v)} />
                  Swap metaphor / image
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={raiseDensity} onCheckedChange={(v) => setRaiseDensity(!!v)} />
                  Push rhyme density
                </label>
              </div>
              <div>
                <Label className="text-xs">Alternates</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`flex-1 h-7 text-xs rounded border ${count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Custom direction (optional)</Label>
                <Textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="e.g. make it more menacing, add a callback to the hook"
                  className="mt-1 h-16 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => { onRewrite(opts); setOpen(false); }}
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Rewrite
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {proposal && (
        <div className="mt-1 mb-2 ml-2 pl-3 border-l-2 border-primary/60 bg-primary/5 rounded-r-md py-2 pr-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-primary/80">
              Alternate {proposal.selectedIdx + 1} of {total}
            </div>
            {total > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onSelectAlternate(-1)}
                  className="p-0.5 text-primary/70 hover:text-primary"
                  title="Previous alternate"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onSelectAlternate(1)}
                  className="p-0.5 text-primary/70 hover:text-primary"
                  title="Next alternate"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <BarDiff original={proposal?.original ?? line} proposed={selectedAlt} />
          <div className="flex gap-1 mt-2 flex-wrap">
            <Button size="sm" variant="default" onClick={onAccept}>
              <Check className="h-3.5 w-3.5 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMoreAlternates(opts)}
              disabled={rewriting || total >= 8}
            >
              {rewriting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              More
            </Button>
            <Button size="sm" variant="ghost" onClick={onRevert}>
              <X className="h-3.5 w-3.5 mr-1" /> Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// BulkRewriteBar — sticky bottom toolbar for bulk bar rewrites.
// Extracted from track.$id.tsx for modularity.

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, Wand2 } from "lucide-react";

export type BulkOpts = {
  keepEndSound: boolean;
  swapMetaphor: boolean;
  raiseDensity: boolean;
  custom: string;
  count: number;
};

export const DEFAULT_BULK_OPTS: BulkOpts = {
  keepEndSound: true,
  swapMetaphor: false,
  raiseDensity: false,
  custom: "",
  count: 2,
};

export type BulkRewriteBarProps = {
  selectedCount: number;
  bulkOpts: BulkOpts;
  bulkRunning: boolean;
  onOptsChange: (opts: BulkOpts) => void;
  onRun: () => void;
  onAcceptAll: () => void;
  onDiscardAll: () => void;
};

export function BulkRewriteBar({
  selectedCount,
  bulkOpts,
  bulkRunning,
  onOptsChange,
  onRun,
  onAcceptAll,
  onDiscardAll,
}: BulkRewriteBarProps) {
  return (
    <div className="sticky bottom-4 z-20">
      <Card className="p-3 shadow-lg border-primary/40 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-display font-semibold shrink-0">
            Bulk rewrite
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {selectedCount} selected
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={bulkOpts.keepEndSound} onCheckedChange={(v) => onOptsChange({ ...bulkOpts, keepEndSound: !!v })} />
              Keep end-sound
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={bulkOpts.swapMetaphor} onCheckedChange={(v) => onOptsChange({ ...bulkOpts, swapMetaphor: !!v })} />
              Swap image
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={bulkOpts.raiseDensity} onCheckedChange={(v) => onOptsChange({ ...bulkOpts, raiseDensity: !!v })} />
              Push density
            </label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Alts</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onOptsChange({ ...bulkOpts, count: n })}
                  className={`h-6 w-6 text-xs rounded border ${bulkOpts.count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >{n}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 ml-auto">
            <Button size="sm" variant="ghost" onClick={onDiscardAll} disabled={bulkRunning}>
              <X className="h-3.5 w-3.5 mr-1" /> Discard all
            </Button>
            <Button size="sm" variant="outline" onClick={onAcceptAll} disabled={bulkRunning}>
              <Check className="h-3.5 w-3.5 mr-1" /> Accept all
            </Button>
            <Button size="sm" onClick={onRun} disabled={bulkRunning || selectedCount === 0}>
              {bulkRunning
                ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                : <Wand2 className="h-3.5 w-3.5 mr-1" />}
              Rewrite {selectedCount || ""}
            </Button>
          </div>
        </div>
        <Textarea
          value={bulkOpts.custom}
          onChange={(e) => onOptsChange({ ...bulkOpts, custom: e.target.value })}
          placeholder="Optional direction applied to every selected bar (e.g. 'darker imagery', 'callback to the hook')"
          className="mt-2 h-12 text-xs"
        />
      </Card>
    </div>
  );
}

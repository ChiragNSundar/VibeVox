// StyleMemoryPanel — style memory dashboard, stats, history & import/export.
// Extracted from settings.tsx for modularity.

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Download, Upload, History, Trash2,
} from "lucide-react";
import {
  styleMemoryStats,
  exportStyleMemory,
  analyzeImport,
  clearStyleMemory,
  removeStyleMemoryEntry,
  clearTrainHistory,
  type StyleMemoryEntry,
  type TrainRunRecord,
  type ImportPlan,
} from "@/lib/style-memory";
import { ImportMergeDialog } from "@/components/ImportMergeDialog";
import { toast } from "sonner";

export type StyleMemoryPanelProps = {
  memory: StyleMemoryEntry[];
  history: TrainRunRecord[];
  onMemoryChange: (newMemory: StyleMemoryEntry[]) => void;
  onHistoryChange: (newHistory: TrainRunRecord[]) => void;
};

export function StyleMemoryPanel({
  memory,
  history,
  onMemoryChange,
  onHistoryChange,
}: StyleMemoryPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importPlan, setImportPlan] = useState<ImportPlan | null>(null);

  const stats = styleMemoryStats();
  const maxBucket = Math.max(1, ...stats.scoreBuckets.map((b) => b.count));
  const maxVibe = Math.max(1, ...stats.vibeBreakdown.map((v) => v.count));

  function deleteMemory(id: string) {
    removeStyleMemoryEntry(id);
    onMemoryChange(memory.filter((e) => e.id !== id));
  }

  function clearAll() {
    if (!confirm("Clear all style memory? This cannot be undone.")) return;
    clearStyleMemory();
    onMemoryChange([]);
    toast.success("Style memory cleared");
  }

  function doExport() {
    const json = exportStyleMemory();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voxscript-memory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Memory exported");
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const plan = analyzeImport(String(reader.result || ""));
        setImportPlan(plan);
      } catch (e) {
        toast.error((e as Error).message);
      }
    };
    reader.readAsText(file);
  }

  function clearHistoryAll() {
    if (!confirm("Clear training history?")) return;
    clearTrainHistory();
    onHistoryChange([]);
  }

  return (
    <>
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Training Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={doExport} disabled={!stats.count}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Import
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onImportFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Examples</div>
            <div className="font-display text-2xl font-semibold">{stats.count}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Total bars</div>
            <div className="font-display text-2xl font-semibold">{stats.totalBars}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Avg score</div>
            <div className="font-display text-2xl font-semibold">{stats.avgScore.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Top score</div>
            <div className="font-display text-2xl font-semibold">{stats.topScore.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></div>
          </div>
        </div>

        {stats.count > 0 && (
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="font-display text-sm font-semibold mb-2">Score distribution</h3>
              <div className="space-y-1.5">
                {stats.scoreBuckets.map((b) => (
                  <div key={b.bucket} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{b.bucket}</span>
                    <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold mb-2">By vibe</h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {stats.vibeBreakdown.map((v) => (
                  <div key={v.vibe} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-muted-foreground truncate">{v.vibe}</span>
                    <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(v.count / maxVibe) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {stats.count > 0 && stats.sourceBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.sourceBreakdown.map((s) => (
              <Badge key={s.source} variant="outline" className="text-xs">
                {s.source}: {s.count}
              </Badge>
            ))}
          </div>
        )}

        {/* Training history */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" /> Recent training runs
            </h3>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistoryAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No runs yet. Hit Train below to start a session.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {history.slice(0, 20).map((h) => {
                const mins = Math.max(1, Math.round((h.endedAt - h.startedAt) / 60000));
                return (
                  <div key={h.id} className="flex items-center gap-3 text-xs p-2 rounded border border-border">
                    <Badge variant={h.mode === "local" ? "outline" : "secondary"} className="text-[10px]">
                      {h.mode}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(h.startedAt).toLocaleString()}
                    </span>
                    <span className="ml-auto tabular-nums">
                      {h.completed}/{h.rounds} rounds · {h.harvested} saved · avg {h.avgScore.toFixed(1)} · top {h.topScore.toFixed(1)} · {mins}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {memory.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Memory library</h3>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memory.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm truncate">{e.title}</span>
                      <Badge variant="secondary" className="text-xs">{e.drakeScore.toFixed(1)}/10</Badge>
                      {e.vibe && <Badge variant="outline" className="text-xs">{e.vibe}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {e.bars.slice(0, 2).join(" / ")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMemory(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <ImportMergeDialog
        plan={importPlan}
        onClose={() => setImportPlan(null)}
        onApplied={(r) => {
          setImportPlan(null);
          toast.success(`+${r.added} added · ${r.updated} updated · ${r.kept} kept · ${r.total} total`);
        }}
      />
    </>
  );
}

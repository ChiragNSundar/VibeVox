import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTracks, deleteTrack } from "@/lib/tracks.functions";
import { getDeviceId } from "@/lib/device-id";
import {
  isLocalOnly,
  listTracks as listLocalTracks,
  deleteTrack as deleteLocalTrack,
  downloadBundle,
} from "@/lib/local-store";
import {
  toMultiTrackPlainText,
  toMultiTrackGeniusMarkdown,
  openMultiTrackPrintWindow,
  downloadBlob,
  type TrackExportItem,
} from "@/lib/exports";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import {
  Mic,
  Plus,
  Database,
  Search,
  SortAsc,
  Music,
  Trash2,
  CheckSquare,
  Square,
  Download,
  X,
  Printer,
  FileText,
  FileCode,
  Archive,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/library")({
  head: () => ({ meta: [{ title: "Your library · VibeVox" }] }),
  component: LibraryPage,
  errorComponent: ({ error }) => {
    console.error("Library page error:", error);
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-16">
        <Card className="p-8 space-y-4 border-dashed">
          <div className="text-4xl">🎵</div>
          <h2 className="text-xl font-bold">Library Error</h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Could not load library"}
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </Card>
      </div>
    );
  },
});

type SortKey = "newest" | "oldest" | "title-az" | "title-za" | "status";

function LibraryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchTracks = useServerFn(listTracks);
  const deleteTrackRpc = useServerFn(deleteTrack);
  const localMode = isLocalOnly();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keyboard shortcut: Esc to exit select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectMode) {
        setSelectMode(false);
        setSelectedTrackIds(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectMode]);

  const { data: rawData, isLoading: isQueryLoading } = useQuery({
    queryKey: ["tracks"],
    enabled: isClient,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (typeof window === "undefined") return [];
      try {
        const localTracks = await listLocalTracks();
        if (localTracks.length > 0 || localMode) {
          return localTracks;
        }
        return await fetchTracks({ data: { deviceId: getDeviceId() } }).catch(() => localTracks);
      } catch {
        return [];
      }
    },
    refetchInterval: (q) => {
      const rows = q.state.data as { status?: string }[] | undefined;
      return rows?.some((r) => r?.status !== "done" && r?.status !== "error") ? 3000 : false;
    },
  });

  const isLoading = !isClient || isQueryLoading;
  const data = rawData ?? [];

  const handleDeleteTrack = async (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this track?")) return;

    try {
      await deleteLocalTrack(trackId).catch(() => {});
      if (!localMode) {
        await deleteTrackRpc({ data: { id: trackId } });
      }
      qc.invalidateQueries({ queryKey: ["tracks"] });
      toast.success("Track deleted");
    } catch {
      toast.error("Failed to delete track");
    }
  };

  // Selection toggles
  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) setSelectedTrackIds(new Set());
      return !prev;
    });
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Counts for status
  const statusCounts = useMemo(() => {
    if (!data) return { all: 0, done: 0, processing: 0, error: 0 };
    return {
      all: data.length,
      done: data.filter((t) => t?.status === "done").length,
      processing: data.filter((t) => t?.status !== "done" && t?.status !== "error").length,
      error: data.filter((t) => t?.status === "error").length,
    };
  }, [data]);

  const statusOptions: MultiSelectOption[] = useMemo(
    () => [
      { value: "done", label: "Ready", badge: String(statusCounts.done) },
      { value: "processing", label: "In Progress", badge: String(statusCounts.processing) },
      { value: "error", label: "Failed", badge: String(statusCounts.error) },
    ],
    [statusCounts],
  );

  // Filter + Sort
  const filtered = useMemo(() => {
    if (!data) return [];
    let items = [...data];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((t) => (t?.title || "").toLowerCase().includes(q));
    }

    // Status multi-filter
    if (statusFilter.length > 0) {
      items = items.filter((t) => {
        const st = t?.status;
        const normalized = st === "done" ? "done" : st === "error" ? "error" : "processing";
        return statusFilter.includes(normalized);
      });
    }

    // Sort
    items.sort((a, b) => {
      const dateA = new Date("createdAt" in a ? (a as any).createdAt : (a as any).created_at).getTime() || 0;
      const dateB = new Date("createdAt" in b ? (b as any).createdAt : (b as any).created_at).getTime() || 0;
      const titleA = a?.title || "";
      const titleB = b?.title || "";
      const statusA = a?.status || "";
      const statusB = b?.status || "";
      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "title-az":
          return titleA.localeCompare(titleB);
        case "title-za":
          return titleB.localeCompare(titleA);
        case "status":
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    return items;
  }, [data, searchQuery, statusFilter, sortBy]);

  const selectAllVisible = () => {
    setSelectedTrackIds(new Set(filtered.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedTrackIds(new Set());
  };

  // Batch Export
  const handleBatchExport = (format: "bundle" | "pdf" | "md" | "txt") => {
    const selectedTracks = data.filter((t) => selectedTrackIds.has(t.id));
    if (selectedTracks.length === 0) {
      toast.error("No tracks selected to export");
      return;
    }

    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === "bundle") {
      downloadBundle(getDeviceId(), Array.from(selectedTrackIds), `vibevox-selection-${dateTag}.json`)
        .then(() => toast.success(`Exported ${selectedTracks.length} tracks as bundle`))
        .catch((err) => toast.error(`Bundle export failed: ${err.message}`));
      return;
    }

    const exportItems: TrackExportItem[] = selectedTracks.map((t: any) => {
      let parsedLyrics = null;
      if (t.lyrics) {
        try {
          parsedLyrics = typeof t.lyrics === "string" ? JSON.parse(t.lyrics) : t.lyrics;
        } catch {
          /* ignore */
        }
      }
      return {
        title: t.title || "Untitled",
        lyrics: parsedLyrics,
        rawTranscript: t.transcript || t.raw_transcript,
        bpm: t.bpm,
        createdAt: "createdAt" in t ? t.createdAt : t.created_at,
      };
    });

    if (format === "pdf") {
      openMultiTrackPrintWindow(exportItems);
      toast.success("Opening print / PDF window…");
    } else if (format === "md") {
      downloadBlob(`vibevox-lyrics-${dateTag}.md`, toMultiTrackGeniusMarkdown(exportItems), "text/markdown");
      toast.success(`Exported ${selectedTracks.length} tracks as Markdown`);
    } else if (format === "txt") {
      downloadBlob(`vibevox-lyrics-${dateTag}.txt`, toMultiTrackPlainText(exportItems), "text/plain");
      toast.success(`Exported ${selectedTracks.length} tracks as Text`);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedTrackIds.size === 0) return;
    setIsBatchDeleting(true);
    const idsToDelete = Array.from(selectedTrackIds);
    let deletedCount = 0;

    try {
      for (const trackId of idsToDelete) {
        await deleteLocalTrack(trackId).catch(() => {});
        if (!localMode) {
          await deleteTrackRpc({ data: { id: trackId } }).catch(() => {});
        }
        deletedCount++;
      }
      qc.invalidateQueries({ queryKey: ["tracks"] });
      toast.success(`Successfully deleted ${deletedCount} track${deletedCount === 1 ? "" : "s"}`);
      setSelectedTrackIds(new Set());
      setDeleteConfirmOpen(false);
      if (idsToDelete.length === filtered.length) {
        setSelectMode(false);
      }
    } catch (err: any) {
      toast.error(`Error deleting tracks: ${err?.message || "unknown"}`);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const selectedTrackObjects = useMemo(() => {
    return data.filter((t) => selectedTrackIds.has(t.id));
  }, [data, selectedTrackIds]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your tracks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every freestyle you've turned into lyrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <Button
              variant={selectMode ? "secondary" : "outline"}
              onClick={toggleSelectMode}
              className="text-xs"
            >
              {selectMode ? (
                <>
                  <X className="h-4 w-4 mr-1.5" /> Done
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-1.5" /> Select tracks
                </>
              )}
            </Button>
          )}
          <Link to="/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> New track
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + Filter Bar */}
      {data && data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-[220px]">
            <MultiSelect
              options={statusOptions}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter status..."
              searchPlaceholder="Filter statuses..."
              maxVisibleTags={1}
            />
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SortAsc className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title-az">Title A → Z</SelectItem>
              <SelectItem value="title-za">Title Z → A</SelectItem>
              <SelectItem value="status">By status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Track List */}
      {isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading tracks">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Mic}
          iconColor="text-primary"
          title="No tracks yet"
          description="Upload or record a freestyle to get started. Your AI ghostwriter will turn mumbled flows into polished lyrics."
          actionLabel="Create your first track"
          onAction={() => navigate({ to: "/new" })}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          iconColor="text-muted-foreground"
          title="No matching tracks"
          description={`No tracks match "${searchQuery}". Try a different search term or clear your filters.`}
          actionLabel="Clear search"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter([]);
          }}
        />
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {filtered.length} track{filtered.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
              {statusFilter.length > 0 && ` · filtered by ${statusFilter.join(", ")}`}
            </span>
            {selectMode && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectedTrackIds.size === filtered.length ? clearSelection : selectAllVisible}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {selectedTrackIds.size === filtered.length ? "Deselect all" : "Select all visible"}
                </button>
              </div>
            )}
          </div>

          {filtered.map((t) => {
            const rawDate = "createdAt" in t ? (t as any).createdAt : (t as any).created_at;
            const validDate = rawDate ? new Date(rawDate) : new Date();
            const dateStr = !isNaN(validDate.getTime())
              ? formatDistanceToNow(validDate, { addSuffix: true })
              : "recently";
            const isSelected = selectedTrackIds.has(t.id);

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (selectMode) {
                    toggleTrackSelection(t.id);
                  } else {
                    navigate({ to: "/track/$id", params: { id: t.id } });
                  }
                }}
                className="cursor-pointer block transition-transform active:scale-[0.998]"
              >
                <Card
                  className={`p-4 transition-all group ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-3">
                      {selectMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackSelection(t.id);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-1"
                          title={isSelected ? "Deselect track" : "Select track"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0 group-hover:bg-primary/10 transition-colors">
                          <Music className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-display font-semibold truncate">
                          {t.title || "Untitled"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          {dateStr}
                          {(t as any).bpm && <span>· {(t as any).bpm} BPM</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={t.status} />
                      {!selectMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100"
                          onClick={(e) => handleDeleteTrack(e, t.id)}
                          title="Delete track"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Floating Bulk Action Bar */}
      {selectMode && (
        <div className="fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto max-w-xl px-2 sm:px-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Card className="p-2.5 sm:p-3 shadow-2xl border-primary/50 bg-background/95 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-display">
              <span className="font-semibold text-foreground">
                {selectedTrackIds.size} <span className="hidden sm:inline">of {filtered.length}</span> selected
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedTrackIds.size === filtered.length ? clearSelection : selectAllVisible}
                className="text-xs h-8 px-2 sm:px-3"
              >
                {selectedTrackIds.size === filtered.length ? "Deselect" : "Select all"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedTrackIds.size === 0}
                    className="text-xs h-8 px-2 sm:px-3 border-primary/30 hover:border-primary"
                  >
                    <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Export ({selectedTrackIds.size})</span>
                    <span className="sm:hidden font-mono">({selectedTrackIds.size})</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Batch Export Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBatchExport("bundle")} className="gap-2 cursor-pointer">
                    <Archive className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">VibeVox JSON Bundle</span>
                      <span className="text-[10px] text-muted-foreground">Full backup with audio & bars</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchExport("pdf")} className="gap-2 cursor-pointer">
                    <Printer className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">PDF Songbook</span>
                      <span className="text-[10px] text-muted-foreground">Formatted sheet / print dialog</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchExport("md")} className="gap-2 cursor-pointer">
                    <FileCode className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Genius Markdown (.md)</span>
                      <span className="text-[10px] text-muted-foreground">Genius-style markdown file</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchExport("txt")} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Plain Text (.txt)</span>
                      <span className="text-[10px] text-muted-foreground">Compiled readable lyrics</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                disabled={selectedTrackIds.size === 0}
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs h-8 px-2 sm:px-3"
              >
                <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectMode}
                title="Exit select mode (Esc)"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for Batch Delete */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedTrackIds.size} tracks?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. These tracks and their takes will be permanently removed from your device and cloud storage.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-muted/20 rounded-md border border-border/40 text-xs">
            {selectedTrackObjects.slice(0, 8).map((t) => (
              <div key={t.id} className="truncate font-mono text-muted-foreground">
                • {t.title || "Untitled track"}
              </div>
            ))}
            {selectedTrackObjects.length > 8 && (
              <div className="text-muted-foreground italic text-[11px] pt-1">
                + {selectedTrackObjects.length - 8} more tracks
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isBatchDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting…
                </>
              ) : (
                `Permanently Delete (${selectedTrackIds.size})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    done: { label: "Ready", cls: "bg-primary/15 text-primary" },
    processing: { label: "Processing", cls: "bg-muted text-muted-foreground" },
    transcribing: { label: "Transcribing", cls: "bg-muted text-muted-foreground" },
    writing: { label: "Writing lyrics", cls: "bg-muted text-muted-foreground" },
    error: { label: "Failed", cls: "bg-destructive/15 text-destructive" },
  };
  const m = map[status] ?? map.processing;
  return <span className={`text-xs px-2 py-1 rounded-full ${m.cls}`}>{m.label}</span>;
}

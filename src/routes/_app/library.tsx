import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTracks, deleteTrack } from "@/lib/tracks.functions";
import { getDeviceId } from "@/lib/device-id";
import { listTracks as listLocalTracks, deleteTrack as deleteLocalTrack, isLocalOnly, getDeviceId as getLocalDeviceId } from "@/lib/local-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { Mic, Plus, Database, Search, SortAsc, Filter, Music, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/library")({
  head: () => ({ meta: [{ title: "Your library · VoxScript" }] }),
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
type StatusFilter = "all" | "done" | "processing" | "error";

function LibraryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchTracks = useServerFn(listTracks);
  const deleteTrackRpc = useServerFn(deleteTrack);
  const localMode = isLocalOnly();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

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
      if (localMode) {
        await deleteLocalTrack(trackId);
      } else {
        await deleteTrackRpc({ data: { id: trackId } });
      }
      qc.invalidateQueries({ queryKey: ["tracks"] });
      toast.success("Track deleted");
    } catch {
      toast.error("Failed to delete track");
    }
  };

  // Filter + Sort
  const filtered = useMemo(() => {
    if (!data) return [];
    let items = [...data];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((t) => (t?.title || "").toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "processing") {
        items = items.filter((t) => (t?.status || "") !== "done" && (t?.status || "") !== "error");
      } else {
        items = items.filter((t) => (t?.status || "") === statusFilter);
      }
    }

    // Sort
    items.sort((a, b) => {
      const dateA = new Date('createdAt' in a ? (a as any).createdAt : (a as any).created_at).getTime() || 0;
      const dateB = new Date('createdAt' in b ? (b as any).createdAt : (b as any).created_at).getTime() || 0;
      const titleA = a?.title || "";
      const titleB = b?.title || "";
      const statusA = a?.status || "";
      const statusB = b?.status || "";
      switch (sortBy) {
        case "newest": return dateB - dateA;
        case "oldest": return dateA - dateB;
        case "title-az": return titleA.localeCompare(titleB);
        case "title-za": return titleB.localeCompare(titleA);
        case "status": return statusA.localeCompare(statusB);
        default: return 0;
      }
    });

    return items;
  }, [data, searchQuery, sortBy, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!data) return { all: 0, done: 0, processing: 0, error: 0 };
    return {
      all: data.length,
      done: data.filter((t) => t.status === "done").length,
      processing: data.filter((t) => t.status !== "done" && t.status !== "error").length,
      error: data.filter((t) => t.status === "error").length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your tracks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every freestyle you've turned into lyrics.
          </p>
        </div>
        <Link to="/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" /> New track
          </Button>
        </Link>
      </div>

      {/* Search + Filter Bar */}
      {data && data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="done">Ready ({statusCounts.done})</SelectItem>
              <SelectItem value="processing">In Progress ({statusCounts.processing})</SelectItem>
              <SelectItem value="error">Failed ({statusCounts.error})</SelectItem>
            </SelectContent>
          </Select>
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
          onAction={() => { setSearchQuery(""); setStatusFilter("all"); }}
        />
      ) : (
        <div className="grid gap-3">
          <div className="text-xs text-muted-foreground px-1">
            {filtered.length} track{filtered.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
          {filtered.map((t) => {
            const rawDate = 'createdAt' in t ? (t as any).createdAt : (t as any).created_at;
            const validDate = rawDate ? new Date(rawDate) : new Date();
            const dateStr = !isNaN(validDate.getTime()) ? formatDistanceToNow(validDate, { addSuffix: true }) : "recently";

            return (
              <div
                key={t.id}
                onClick={() => navigate({ to: "/track/$id", params: { id: t.id } })}
                className="cursor-pointer block"
              >
                <Card className="p-4 hover:border-primary/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Music className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-semibold truncate">{t.title || "Untitled"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          {dateStr}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={t.status} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100"
                        onClick={(e) => handleDeleteTrack(e, t.id)}
                        title="Delete track"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
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

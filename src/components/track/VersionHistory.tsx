// VersionHistory — Panel displaying saved track snapshots with restore capability.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { History, RotateCcw, Trash2 } from "lucide-react";
import {
  listTrackSnapshots,
  deleteTrackSnapshot,
  type TrackSnapshot,
} from "@/lib/track-versions";

export type VersionHistoryProps = {
  trackId: string;
  onRestore: (snapshot: TrackSnapshot) => void;
};

export function VersionHistory({ trackId, onRestore }: VersionHistoryProps) {
  const [snapshots, setSnapshots] = useState<TrackSnapshot[]>([]);

  useEffect(() => {
    setSnapshots(listTrackSnapshots(trackId));
  }, [trackId]);

  const handleDelete = (snapshotId: string) => {
    const updated = deleteTrackSnapshot(trackId, snapshotId);
    setSnapshots(updated);
  };

  if (snapshots.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <History className="h-3.5 w-3.5" />
          Snapshots ({snapshots.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider">
          Track Version History
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {snapshots.map((s) => (
          <DropdownMenuItem
            key={s.id}
            className="flex items-center justify-between gap-2 p-2 cursor-pointer"
            onClick={() => onRestore(s)}
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-xs truncate">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(s.timestamp).toLocaleString()}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(s.id);
              }}
              title="Delete snapshot"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

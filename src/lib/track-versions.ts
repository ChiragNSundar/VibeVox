// Track Version History — persistent snapshots of track lyrics, cadence, quality, and brief.
// Enables full bar-by-bar or track-level rollback across sessions.

import { cacheGet, cacheSet } from "./cache";

export type TrackSnapshot = {
  id: string;
  trackId: string;
  timestamp: number;
  label: string;
  lyrics: any;
  cadenceMap?: any;
  quality?: any;
  styleBrief?: any;
};

const STORAGE_KEY_PREFIX = "voxscript:snapshots:";

export function saveTrackSnapshot(
  trackId: string,
  label: string,
  lyrics: any,
  cadenceMap?: any,
  quality?: any,
  styleBrief?: any
): TrackSnapshot {
  if (typeof localStorage === "undefined") {
    return { id: "", trackId, timestamp: Date.now(), label, lyrics };
  }
  const key = `${STORAGE_KEY_PREFIX}${trackId}`;
  const existing = listTrackSnapshots(trackId);

  const snapshot: TrackSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    trackId,
    timestamp: Date.now(),
    label,
    lyrics,
    cadenceMap,
    quality,
    styleBrief,
  };

  const updated = [snapshot, ...existing].slice(0, 20); // Keep max 20 snapshots per track
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    /* quota error */
  }

  return snapshot;
}

export function listTrackSnapshots(trackId: string): TrackSnapshot[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackId}`);
    if (!raw) return [];
    return JSON.parse(raw) as TrackSnapshot[];
  } catch {
    return [];
  }
}

export function deleteTrackSnapshot(trackId: string, snapshotId: string): TrackSnapshot[] {
  const existing = listTrackSnapshots(trackId);
  const updated = existing.filter((s) => s.id !== snapshotId);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${trackId}`, JSON.stringify(updated));
  }
  return updated;
}

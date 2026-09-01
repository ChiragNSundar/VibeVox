// Custom client-side error recording and diagnostics system.
// Completely localized; preserves the last 20 runtime errors in localStorage for easy debugging.

export type CapturedError = {
  id: string;
  message: string;
  stack?: string;
  boundary?: string;
  route: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const ERROR_STORAGE_KEY = "voxscript:client-errors";
const MAX_STORED_ERRORS = 20;

export function reportCustomError(
  error: unknown,
  context: { boundary?: string; [key: string]: unknown } = {},
): CapturedError {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const route = typeof window !== "undefined" ? window.location.pathname : "";

  const record: CapturedError = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    message,
    stack,
    boundary: context.boundary,
    route,
    timestamp: Date.now(),
    metadata: context,
  };

  // Console output
  console.error(`[VoxScript Error] (${context.boundary || "global"}):`, error, context);

  // Local persistence
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(ERROR_STORAGE_KEY);
      const list: CapturedError[] = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED_ERRORS)));
    } catch {
      // Ignore quota errors
    }
  }

  return record;
}

export function getRecordedErrors(): CapturedError[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ERROR_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CapturedError[]) : [];
  } catch {
    return [];
  }
}

export function clearRecordedErrors(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function formatDiagnostics(error: unknown, route?: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "No stack trace available";
  return [
    `VoxScript Error Diagnostics`,
    `----------------------------`,
    `Time: ${new Date().toISOString()}`,
    `Route: ${route || (typeof window !== "undefined" ? window.location.pathname : "unknown")}`,
    `User-Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "SSR"}`,
    `Message: ${message}`,
    ``,
    `Stack:`,
    stack,
  ].join("\n");
}

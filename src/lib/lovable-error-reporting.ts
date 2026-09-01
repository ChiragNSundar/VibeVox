// Application error reporting utility.

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("Application error captured:", error, {
    route: window.location?.pathname,
    ...context,
  });
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home, Copy, Check, Terminal, ChevronDown, ChevronUp, Music, PenLine, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { reportCustomError, formatDiagnostics } from "../lib/custom-error-reporting";

import "../lib/fonts";
import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center p-8 border-border/80 shadow-2xl bg-card/70 backdrop-blur-md space-y-6">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
            404 · Out of Pocket
          </Badge>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Track Not Found</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            The cadence or route you're looking for doesn't exist or has moved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link to="/library">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Music className="h-3.5 w-3.5 text-primary" />
              Library
            </Button>
          </Link>
          <Link to="/scribble">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <PenLine className="h-3.5 w-3.5 text-emerald-400" />
              Scribble
            </Button>
          </Link>
          <Link to="/brain">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Brain className="h-3.5 w-3.5 text-amber-400" />
              Local Brain
            </Button>
          </Link>
          <Link to="/new">
            <Button size="sm" className="w-full gap-1.5 text-xs">
              New Track
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

  useEffect(() => {
    reportCustomError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  function handleCopy() {
    const text = formatDiagnostics(error);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Diagnostic details copied to clipboard");
  }

  function handleHardReset() {
    if (confirm("Reset application cache and reload? Your saved local tracks and brain files will remain safe.")) {
      router.invalidate();
      window.location.href = "/";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="max-w-lg w-full p-6 sm:p-8 border-destructive/40 shadow-2xl bg-card/80 backdrop-blur-md space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
                Session Interrupted
              </h1>
              <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                Runtime Error
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Something slipped out of pocket. Your local tracks, brain files, and recorded takes are preserved safely in local storage.
            </p>
          </div>
        </div>

        {/* Error message card */}
        <div className="p-3 rounded-lg bg-background/80 border border-border/70 font-mono text-xs text-destructive/90 overflow-x-auto">
          {error.message || "An unexpected error occurred during rendering."}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button
            size="sm"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-xs gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Diagnostics"}
          </Button>

          <Link to="/library">
            <Button size="sm" variant="secondary" className="text-xs gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Return Home
            </Button>
          </Link>
        </div>

        {/* Collapsible Technical Details */}
        <div className="border-t pt-4 space-y-2">
          <button
            type="button"
            onClick={() => setShowStack((p) => !p)}
            className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Terminal className="h-3.5 w-3.5" /> Technical Diagnostics
            </span>
            {showStack ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showStack && (
            <div className="space-y-2 pt-1 animate-in fade-in-50 duration-200">
              <pre className="p-3 rounded bg-muted/60 text-[11px] font-mono leading-relaxed text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
                {error.stack || "No call stack available."}
              </pre>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleHardReset}
                  className="text-[10px] text-muted-foreground hover:text-destructive underline"
                >
                  Clear Cache & Hard Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VibeVox — AI Vocal & Lyric Studio" },
      { name: "description", content: "Advanced punch-in lyric studio with localized Brain RAG, VibeLyrics, and cadence intelligence." },
      { name: "author", content: "VibeVox" },
      { property: "og:title", content: "VibeVox — AI Vocal & Lyric Studio" },
      { property: "og:description", content: "Advanced punch-in lyric studio with localized Brain RAG, VibeLyrics, and cadence intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@VibeVox" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

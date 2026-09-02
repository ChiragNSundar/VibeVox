import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic, Library as LibraryIcon, Plus, Settings as SettingsIcon,
  Cpu, Fingerprint as FingerprintIcon, Radio, Menu, X, Brain as BrainIcon, PenLine as ScribbleIcon, Sparkles,
} from "lucide-react";
import { LocalStatusPill } from "@/components/LocalStatusPill";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { NotificationProvider } from "@/hooks/use-notifications";
import { NotificationCenter } from "@/components/NotificationCenter";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const NAV_ITEMS = [
  { to: "/library",    icon: LibraryIcon,      label: "Library" },
  { to: "/scribble",   icon: Sparkles,         label: "VibeLyrics", badge: "NEW" },
  { to: "/brain",      icon: BrainIcon,        label: "Brain" },
  { to: "/references", icon: FingerprintIcon,  label: "References" },
  { to: "/connect",    icon: Cpu,              label: "Connect" },
  { to: "/settings",   icon: SettingsIcon,     label: "Settings" },
  { to: "/live",       icon: Radio,            label: "Live" },
] as const;

const ONBOARDING_KEY = "voxscript:onboarding-complete";

function AppShell() {
  const navigate = useNavigate();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useShortcuts({
    onToggleOverlay: () => setShortcutsOpen((p) => !p),
  });

  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Onboarding first-visit guard: redirect new users landing on / or /library to onboarding
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed && (currentPath === "/" || currentPath === "/library")) {
      navigate({ to: "/onboarding" });
    }
  }, [currentPath, navigate]);

  return (
    <NotificationProvider>
      <div className="min-h-screen">
        <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Link to="/library" className="flex items-center gap-2 shrink-0">
              <Mic className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold">VibeVox</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1.5">
              <LocalStatusPill />
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isVibe = item.to === "/scribble";
                return (
                  <Link key={item.to} to={item.to}>
                    <Button
                      variant={currentPath.startsWith(item.to) ? "secondary" : "ghost"}
                      size="sm"
                      className={`text-xs ${isVibe ? "font-semibold text-amber-300 hover:text-amber-200" : ""}`}
                    >
                      <Icon className={`h-3.5 w-3.5 mr-1.5 ${isVibe ? "text-amber-400" : ""}`} />
                      {item.label}
                      {"badge" in item && (
                        <span className="ml-1 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
              <NotificationCenter />
              <Link to="/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  New
                </Button>
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <LocalStatusPill />
              <NotificationCenter />
              <Link to="/new">
                <Button size="sm" className="h-8 px-2.5">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setMobileMenuOpen((p) => !p)}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
              <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={currentPath.startsWith(item.to) ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-sm"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                        {"badge" in item && (
                          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <Outlet />
        </main>

        {/* Keyboard shortcuts overlay */}
        <KeyboardShortcutsOverlay
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </div>
    </NotificationProvider>
  );
}

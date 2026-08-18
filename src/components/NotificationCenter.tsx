// NotificationCenter — Slide-out drawer showing pipeline stage progress and history.

import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Sparkles, Trash2, X, Activity } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, clearNotifications, markAllAsRead } = useNotifications();

  return (
    <Drawer.Root open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) markAllAsRead();
    }}>
      <Drawer.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Pipeline Activity">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs" />
        <Drawer.Content className="fixed bottom-0 right-0 top-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Pipeline Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications} title="Clear all">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm">No activity logged yet.</p>
                <p className="text-xs">Progress updates from generation and scoring will appear here.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge variant={item.stage === "done" ? "default" : "outline"} className="text-[10px] uppercase">
                      {item.stage}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground">{item.message}</p>
                  {(item.iteration !== undefined || item.score !== undefined) && (
                    <div className="flex gap-2 text-muted-foreground pt-1">
                      {item.iteration !== undefined && <span>Pass #{item.iteration}</span>}
                      {item.score !== undefined && <span>Score: <b>{item.score.toFixed(1)}/10</b></span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

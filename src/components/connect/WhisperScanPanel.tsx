// WhisperScanPanel — discovered Whisper speech-to-text servers.
// Extracted from connect.tsx for modularity.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic2, Loader2, Copy } from "lucide-react";
import {
  corsHint,
  type DiscoveredWhisper,
} from "@/lib/local-discovery";
import { type LlmConfig } from "@/lib/llm-config";
import { toast } from "sonner";

export type WhisperScanPanelProps = {
  config: LlmConfig;
  whispers: DiscoveredWhisper[];
  testing: "llm" | "whisper" | null;
  testResult: { kind: "llm" | "whisper"; ok: boolean; msg: string } | null;
  onUpdateConfig: (patch: Partial<LlmConfig>) => void;
  onUseWhisper: (w: DiscoveredWhisper) => void;
  onTestWhisper: () => void;
};

export function WhisperScanPanel({
  config,
  whispers,
  testing,
  testResult,
  onUpdateConfig,
  onUseWhisper,
  onTestWhisper,
}: WhisperScanPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transcription Server Settings</CardTitle>
          <CardDescription>Configure faster-whisper-server or whisper.cpp endpoint for live vocal punch-in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Transcription Mode</Label>
              <Select
                value={config.transcriptionMode ?? "local"}
                onValueChange={(v: "local" | "cloud") => onUpdateConfig({ transcriptionMode: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (faster-whisper-server)</SelectItem>
                  <SelectItem value="cloud">Cloud / Browser fallback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="whisperUrl">Whisper Base URL</Label>
              <Input
                id="whisperUrl"
                value={config.whisperBaseUrl || "http://localhost:9000"}
                onChange={(e) => onUpdateConfig({ whisperBaseUrl: e.target.value })}
                placeholder="http://localhost:9000"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={onTestWhisper} disabled={testing === "whisper"}>
              {testing === "whisper" && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Test Whisper server
            </Button>
            {testResult?.kind === "whisper" && (
              <span className={`text-xs ${testResult.ok ? "text-emerald-500 font-medium" : "text-destructive"}`}>
                {testResult.msg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discovered Whisper Servers</CardTitle>
          <CardDescription>Listening ports scanned on localhost.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {whispers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No Whisper servers found. Run: <code>pip install faster-whisper-server &amp;&amp; faster-whisper-server --port 9000</code></p>
          ) : (
            whispers.map((w) => {
              const active = config.transcriptionMode === "local" && config.whisperBaseUrl === w.baseUrl;
              return (
                <div key={w.baseUrl} className="p-3 rounded-md border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic2 className="h-4 w-4 text-sky-400" />
                      <span className="font-semibold capitalize">{w.backend}</span>
                      <span className="text-muted-foreground">{w.baseUrl}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => onUseWhisper(w)}
                    >
                      {active ? "Active ✓" : "Use this server"}
                    </Button>
                  </div>
                  {corsHint(w.backend) && (
                    <div className="bg-amber-500/10 text-amber-500 p-2 rounded text-[11px] flex items-center justify-between gap-2">
                      <span>CORS startup flag: <code>{corsHint(w.backend)}</code></span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          navigator.clipboard.writeText(corsHint(w.backend)!);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

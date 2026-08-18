import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Brain,
  Play,
  Check,
  X,
  Loader2,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_LLM_CONFIG, loadLlmConfig, pingLlm, saveLlmConfig, isLocalConfig, keyFor, setKeyFor, selectProvider, type LlmConfig } from "@/lib/llm-config";
import { chatProviders, getProvider, type ProviderId } from "@/lib/providers";
import {
  loadStyleMemory,
  loadTrainHistory,
  styleMemoryStats,
  type StyleMemoryEntry,
  type TrainRunRecord,
} from "@/lib/style-memory";
import { CachePanel } from "@/components/CachePanel";
import { isLocalOnly, setLocalOnly, estimateStorage } from "@/lib/local-store";
import { StyleTrainingPanel } from "@/components/settings/StyleTrainingPanel";
import { StyleMemoryPanel } from "@/components/settings/StyleMemoryPanel";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · VoxScript" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [config, setConfig] = useState<LlmConfig>(DEFAULT_LLM_CONFIG);
  const [memory, setMemory] = useState<StyleMemoryEntry[]>([]);
  const [history, setHistory] = useState<TrainRunRecord[]>([]);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [localOnlyState, setLocalOnlyState] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usedBytes: number; quotaBytes: number }>({ usedBytes: 0, quotaBytes: 0 });

  useEffect(() => {
    setConfig(loadLlmConfig());
    setMemory(loadStyleMemory());
    setHistory(loadTrainHistory());
    setLocalOnlyState(isLocalOnly());
    const hasSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!hasSupabase && !isLocalOnly()) {
      setLocalOnly(true);
      setLocalOnlyState(true);
    }
    estimateStorage().then(setStorageEstimate);
  }, []);

  function update<K extends keyof LlmConfig>(key: K, value: LlmConfig[K]) {
    const next = { ...config, [key]: value };
    setConfig(next);
    saveLlmConfig(next);
  }

  function toggleLocalOnly(enabled: boolean) {
    setLocalOnlyState(enabled);
    setLocalOnly(enabled);
  }

  async function testConnection() {
    setPinging(true);
    setPingResult(null);
    const r = await pingLlm(config);
    setPingResult(r);
    setPinging(false);
  }

  const stats = styleMemoryStats();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your AI backend and grow your ghostwriter's style memory.
        </p>
      </div>

      {/* LLM Backend */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">AI Backend</h2>
        </div>

        <div className="space-y-4 pt-2">
          {isLocalConfig(config) ? (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Local setup (one time):</p>
              <p>1. Install <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-primary underline">Ollama</a> or LM Studio.</p>
              <p>2. Pull a capable model: <code className="bg-background px-1 rounded">ollama pull llama3.1:8b</code> (or qwen2.5:14b, mistral-small)</p>
              <p>3. Allow this site to call your LLM:<br/><code className="bg-background px-1 rounded">OLLAMA_ORIGINS=&apos;*&apos; ollama serve</code></p>
              <p>4. Test the connection below.</p>
            </div>
          ) : (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">{getProvider(config.providerId).label}</p>
              <p>
                Requests go straight from this browser to the provider, with the key held in localStorage.
                Set a spend limit on the key — that&apos;s what actually caps your exposure if it leaks.
              </p>
              <p>Use the <a href="/connect" className="text-primary underline">Connect</a> page to browse models and context sizes.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={config.providerId}
                onValueChange={(v: ProviderId) => {
                  const next = selectProvider(config, v);
                  setConfig(next);
                  saveLlmConfig(next);
                }}
              >
                <SelectTrigger id="provider"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {chatProviders().map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">
                API key {getProvider(config.providerId).needsKey ? "" : "(if required)"}
              </Label>
              <Input
                id="key"
                type={getProvider(config.providerId).needsKey ? "password" : "text"}
                autoComplete="off"
                value={keyFor(config)}
                onChange={(e) => {
                  const next = setKeyFor(config, config.providerId, e.target.value);
                  setConfig(next);
                  saveLlmConfig(next);
                }}
                placeholder={getProvider(config.providerId).keyPlaceholder ?? "sk-…"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              value={config.baseUrl}
              onChange={(e) => update("baseUrl", e.target.value)}
              placeholder={getProvider(config.providerId).baseUrl || "http://localhost:1234/v1"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model name</Label>
            <Input
              id="model"
              value={config.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder={getProvider(config.providerId).defaultModel || "local-model"}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={testConnection} disabled={pinging} variant="outline">
              {pinging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Test connection
            </Button>
            {pingResult && (
              <div className={`text-xs flex items-center gap-1 ${pingResult.ok ? "text-emerald-500" : "text-destructive"}`}>
                {pingResult.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span className="truncate max-w-md">{pingResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Local Persistence */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Local Storage (IndexedDB & OPFS)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Store tracks, audio takes, and style memory entirely in your browser. No cloud required.
          Works offline and survives browser restarts.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Local storage mode</p>
            <p className="text-xs text-muted-foreground">
              Enabled — all data stored locally in IndexedDB & OPFS
            </p>
          </div>
          <Switch
            checked={localOnlyState}
            onCheckedChange={toggleLocalOnly}
            disabled={false}
          />
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Storage used: {(storageEstimate.usedBytes / 1024 / 1024).toFixed(1)} MB / {(storageEstimate.quotaBytes / 1024 / 1024).toFixed(0)} MB</p>
        </div>
      </Card>

      <CachePanel />

      <StyleMemoryPanel
        memory={memory}
        history={history}
        onMemoryChange={setMemory}
        onHistoryChange={setHistory}
      />

      <StyleTrainingPanel
        config={config}
        statsCount={stats.count}
        statsAvgScore={stats.avgScore}
        onMemoryUpdate={() => setMemory(loadStyleMemory())}
        onHistoryUpdate={() => setHistory(loadTrainHistory())}
      />
    </div>
  );
}

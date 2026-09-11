import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function isLocalhost(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

const PingInput = z.object({
  baseUrl: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
});

export const proxyPingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PingInput.parse(d))
  .handler(async ({ data }) => {
    if (!isLocalhost(data.baseUrl)) {
      return { ok: false, message: "Local relay only proxies localhost / 127.0.0.1 backends." };
    }
    const cleanBase = data.baseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data.apiKey) headers.Authorization = `Bearer ${data.apiKey}`;

    try {
      const res = await fetch(`${cleanBase}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: data.model,
          messages: [{ role: "user", content: "Reply with just OK" }],
          max_tokens: 32,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return { ok: false, message: `${res.status} ${res.statusText} — ${txt.slice(0, 200)}` };
      }

      const json = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
      const msg = json.choices?.[0]?.message;
      const content = msg?.content || msg?.reasoning_content || "OK";
      return { ok: true, message: `Connected via local relay. Response: "${content.trim().slice(0, 80)}"` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  });

const ChatInput = z.object({
  baseUrl: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  body: z.record(z.unknown()),
});

export const proxyChatFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    if (!isLocalhost(data.baseUrl)) {
      throw new Error("Local relay only proxies localhost / 127.0.0.1 backends.");
    }
    const cleanBase = data.baseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data.apiKey) headers.Authorization = `Bearer ${data.apiKey}`;

    const res = await fetch(`${cleanBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(data.body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText} — ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
    const msg = json.choices?.[0]?.message;
    return msg?.content || msg?.reasoning_content || "";
  });

const CatalogInput = z.object({
  baseUrl: z.string().min(1),
  apiKey: z.string().optional(),
});

export const proxyCatalogFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CatalogInput.parse(d))
  .handler(async ({ data }) => {
    if (!isLocalhost(data.baseUrl)) {
      return { models: [] };
    }
    const cleanBase = data.baseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {};
    if (data.apiKey) headers.Authorization = `Bearer ${data.apiKey}`;

    try {
      const res = await fetch(`${cleanBase}/models`, { headers });
      if (!res.ok) return { models: [] };
      const json = (await res.json()) as { data?: Array<{ id?: string; context_length?: number }> };
      const rows = Array.isArray(json.data) ? json.data : [];
      return {
        models: rows.map((m) => ({
          id: String(m.id ?? ""),
          contextTokens: m.context_length,
        })).filter((m) => m.id),
      };
    } catch {
      return { models: [] };
    }
  });

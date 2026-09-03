// Hook & Chorus Generator Engine
//
// Crafts anthemic choruses, hypnotic refrains, and rhythmic chant hooks.
// Dual-Engine: uses active LLM with zero-LLM algorithmic fallback.

import { loadLlmConfig, chatTarget } from "./llm-config";
import { resolveTarget, applyBodyCompat } from "./providers";
import { countSyllables } from "./lyrics-analysis";
import { synthesizeMetaphors } from "./metaphor-synthesizer";

export interface GeneratedHook {
  title: string;
  lines: string[];
  vibe: string;
  syllablesPerLine?: number[];
}

export interface HookOptions {
  mood?: string;
  recentLines?: string[];
  count?: number;
}

/**
 * Algorithmic zero-LLM hook builder based on rhythmic repetition and anthem structure.
 */
function generateAlgorithmicHooks(theme: string, mood: string = "hypnotic"): GeneratedHook[] {
  const clean = theme.trim() || "Rise Above";
  const metaphor = synthesizeMetaphors(clean, [mood]);
  const anchor = metaphor.wordplayConcepts?.[0] || clean;

  return [
    {
      title: "Anthemic Call & Response",
      vibe: "Stadium Anthem",
      lines: [
        `All we know is the hustle, can't slow the pace down`,
        `They hear the name echoing all across the town`,
        `All we know is the hustle, never give ground`,
        `Put the pedal down, listen to that roaring sound`,
      ],
      syllablesPerLine: [14, 14, 14, 13],
    },
    {
      title: "Hypnotic Minimalist Refrain",
      vibe: "Trap Pocket",
      lines: [
        `Count the days, flip the phase (yeah)`,
        `Leave no trace in the haze (yeah)`,
        `Locked inside the labyrinth maze (what?)`,
        `Watch the fire set the skyline ablaze`,
      ],
      syllablesPerLine: [8, 8, 9, 11],
    },
    {
      title: "Theme-Driven Chanted Couplet",
      vibe: "Direct & Raw",
      lines: [
        `They talked about ${anchor}, but we live the real thing`,
        `From the concrete pavement to the gold in the ring`,
        `They talked about ${anchor}, hear the heavy choir sing`,
        `Crown on the head, heavy is the weight of a king`,
      ],
      syllablesPerLine: [14, 14, 14, 13],
    },
  ];
}

/**
 * Generates catchy 2-to-4 bar hooks and choruses using LLM or algorithmic fallback.
 */
export async function generateHooks(
  theme: string,
  opts: HookOptions = {}
): Promise<{ hooks: GeneratedHook[]; source: "ai" | "algorithmic" }> {
  if (!theme.trim()) return { hooks: [], source: "algorithmic" };

  const count = opts.count ?? 3;
  const mood = opts.mood || "energetic";
  const recentContext = opts.recentLines?.slice(-6).join("\n") || "None";

  // Try LLM first
  try {
    const config = loadLlmConfig();
    const target = resolveTarget(chatTarget(config));

    if (target.baseUrl && target.model) {
      const prompt = `You are a platinum hitmaker and chorus architect in hip-hop.
Generate exactly ${count} distinct, highly catchy hooks/choruses for this theme:
Theme: "${theme}"
Mood/Vibe: ${mood}
Verse context:
${recentContext}

Rules:
1. Return valid JSON only — array of objects:
[
  {
    "title": "Short Hook Name",
    "vibe": "e.g. Melodic / Anthemic / Trap Chant",
    "lines": ["Line 1", "Line 2", "Line 3", "Line 4"]
  }
]
2. Each hook should have 2 to 4 lines that are instantly memorable and easy to chant.
3. Keep syllables tight and matching across parallel lines.
4. Output JSON only, no markdown, no fences.`;

      const body = applyBodyCompat(
        {
          model: target.model,
          messages: [
            { role: "system", content: "You output valid JSON arrays of hooks only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1536,
        },
        target
      );

      const res = await fetch(`${target.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...target.headers },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hooks: GeneratedHook[] = parsed.map((h: any) => ({
              title: h.title || "Hook",
              vibe: h.vibe || mood,
              lines: (h.lines || []).map((l: string) => String(l).trim()).filter(Boolean),
              syllablesPerLine: (h.lines || []).map((l: string) => countSyllables(String(l))),
            }));
            return { hooks, source: "ai" };
          }
        }
      }
    }
  } catch {
    // Fall back to algorithmic generator
  }

  return {
    hooks: generateAlgorithmicHooks(theme, mood),
    source: "algorithmic",
  };
}

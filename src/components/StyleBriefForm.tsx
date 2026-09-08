import { useEffect, useState, useMemo } from "react";
import type { StyleBrief } from "@/lib/lyrics-analysis";
import { DEFAULT_BRIEF } from "@/lib/lyrics-analysis";
import { loadFingerprints, type Fingerprint } from "@/lib/fingerprint";
import { Link } from "@tanstack/react-router";
import { Fingerprint as FingerprintIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";

const GENRES = [
  ["auto", "Auto-detect"],
  ["trap", "Trap"],
  ["drill", "Drill"],
  ["boom-bap", "Boom-bap"],
  ["melodic", "Melodic rap"],
  ["rnb", "R&B"],
  ["afrobeats", "Afrobeats"],
  ["pop", "Pop"],
] as const;

const REGIONS = [
  ["auto", "Auto-detect"],
  ["hinglish", "Hindi (Romanized / Hinglish)"],
  ["hinglish-english", "Hinglish + English Code-Switch"],
  ["kanglish", "Kannada (Romanized / Kanglish)"],
  ["kanglish-english", "Kanglish + English Code-Switch"],
  ["us-south", "US South"],
  ["us-east", "US East"],
  ["us-west", "US West"],
  ["uk-drill", "UK drill"],
  ["toronto", "Toronto"],
  ["afro-pidgin", "Afrobeats pidgin"],
  ["none", "Plain — no regional slang"],
] as const;

const ATTITUDES = [
  "cocky", "menacing", "heartbroken", "reflective",
  "celebratory", "paranoid", "horny", "defiant", "playful",
];

export function StyleBriefForm({
  value,
  onChange,
}: {
  value: StyleBrief;
  onChange: (b: StyleBrief) => void;
}) {
  const v = { ...DEFAULT_BRIEF, ...value };
  const set = <K extends keyof StyleBrief>(k: K, val: StyleBrief[K]) =>
    onChange({ ...v, [k]: val });
  const toggleAttitude = (a: string) => {
    const cur = v.attitude ?? [];
    set("attitude", cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);
  };

  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  useEffect(() => { setFingerprints(loadFingerprints()); }, []);
  const currentFpId = v.fingerprint?.id ?? "none";

  const genreOptions: MultiSelectOption[] = useMemo(
    () => GENRES.map(([id, label]) => ({ value: id, label })),
    [],
  );

  const regionOptions: MultiSelectOption[] = useMemo(
    () => REGIONS.map(([id, label]) => ({ value: id, label })),
    [],
  );

  const selectedGenres = useMemo(() => {
    if (v.genres && Array.isArray(v.genres) && v.genres.length > 0) return v.genres;
    if (v.genre && v.genre !== "auto") {
      return v.genre.split(/[\/,+]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return ["auto"];
  }, [v.genres, v.genre]);

  const selectedRegions = useMemo(() => {
    if (v.slangRegions && Array.isArray(v.slangRegions) && v.slangRegions.length > 0) return v.slangRegions;
    if (v.slangRegion && v.slangRegion !== "auto") {
      return v.slangRegion.split(/[\/,+]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return ["auto"];
  }, [v.slangRegions, v.slangRegion]);

  const handleGenresChange = (genres: string[]) => {
    let next = genres;
    if (next.length > 1 && next.includes("auto")) {
      next = next.filter((g) => g !== "auto");
    } else if (next.length === 0) {
      next = ["auto"];
    }
    onChange({
      ...v,
      genres: next,
      genre: next.join(" / "),
    });
  };

  const handleRegionsChange = (regions: string[]) => {
    let next = regions;
    if (next.length > 1 && next.includes("auto")) {
      next = next.filter((r) => r !== "auto");
    } else if (next.length === 0) {
      next = ["auto"];
    }
    onChange({
      ...v,
      slangRegions: next,
      slangRegion: next.join(" + "),
    });
  };

  return (
    <Card className="p-5 space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wider flex items-center gap-1.5">
          <FingerprintIcon className="h-3.5 w-3.5" />
          Reference fingerprint
        </Label>
        <div className="flex gap-2 mt-1.5">
          <Select
            value={currentFpId}
            onValueChange={(id) => {
              if (id === "none") set("fingerprint", null);
              else set("fingerprint", fingerprints.find((f) => f.id === id) ?? null);
            }}
          >
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — free-form</SelectItem>
              {fingerprints.map((fp) => (
                <SelectItem key={fp.id} value={fp.id}>
                  {fp.name} · {fp.avgSyllablesPerBar} syl
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to="/references" className="text-xs text-muted-foreground self-center whitespace-nowrap hover:text-foreground">
            Manage →
          </Link>
        </div>
        {v.fingerprint && (
          <div className="text-xs text-muted-foreground mt-2">
            Locked to <span className="text-foreground font-medium">{v.fingerprint.name}</span>:
            ~{v.fingerprint.avgSyllablesPerBar} syl/bar, families {v.fingerprint.endRhymeFamilies.slice(0, 3).join(" · ")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider">Genre / vibe</Label>
          <div className="mt-1.5">
            <MultiSelect
              options={genreOptions}
              selected={selectedGenres}
              onChange={handleGenresChange}
              placeholder="Select genres..."
              searchPlaceholder="Search genres..."
              maxVisibleTags={2}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider">Slang region</Label>
          <div className="mt-1.5">
            <MultiSelect
              options={regionOptions}
              selected={selectedRegions}
              onChange={handleRegionsChange}
              placeholder="Select regions..."
              searchPlaceholder="Search slang regions..."
              maxVisibleTags={2}
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider">Attitude</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ATTITUDES.map((a) => {
            const on = (v.attitude ?? []).includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAttitude(a)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors",
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider">Rhyme density</Label>
          <span className="text-xs text-muted-foreground">
            {v.rhymeDensity}/5 ·{" "}
            {(["simple end-rhyme","light multis","consistent multis","dense multis","chain rhymes + internals"][(v.rhymeDensity ?? 3) - 1])}
          </span>
        </div>
        <Slider
          className="mt-3"
          min={1} max={5} step={1}
          value={[v.rhymeDensity ?? 3]}
          onValueChange={([n]) => set("rhymeDensity", n)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider">Topic / story</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="What's the song about? 1–2 sentences."
            value={v.topic}
            onChange={(e) => set("topic", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider">Custom slang / ad-libs</Label>
          <Input
            className="mt-1.5"
            placeholder={
              v.slangRegion?.includes("hinglish")
                ? "malum hai na, bantai, gully, haq se, public, scene kya hai"
                : v.slangRegion?.includes("kanglish")
                ? "macha, magane, sariyaagi, scene-u, guru, sakkat"
                : "on god, skrr, blicky, fr fr"
            }
            value={v.customSlang}
            onChange={(e) => set("customSlang", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider">Avoid words / clichés</Label>
          <Input
            className="mt-1.5"
            placeholder="grind, hustle, moonlight, demons"
            value={v.avoid}
            onChange={(e) => set("avoid", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider">Structural rules</Label>
          <Input
            className="mt-1.5"
            placeholder='no questions as bars; hook repeats one image'
            value={v.structuralRules}
            onChange={(e) => set("structuralRules", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-sm font-medium">Allow explicit language</div>
          <div className="text-xs text-muted-foreground">Off = radio-edit clean.</div>
        </div>
        <Switch checked={!!v.explicit} onCheckedChange={(x) => set("explicit", x)} />
      </div>
    </Card>
  );
}

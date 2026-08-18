// StyleTrainingPanel — self-play synthetic training dashboard.
// Extracted from settings.tsx for modularity.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Play, Square } from "lucide-react";
import { getProvider } from "@/lib/providers";
import { runLocalPipeline, harvestThresholdFor } from "@/lib/local-pipeline";
import {
  addToStyleMemory,
  loadStyleMemory,
  sampleStyleExamples,
  type StyleMemoryEntry,
} from "@/lib/style-memory";
import { isLocalConfig, type LlmConfig } from "@/lib/llm-config";
import { trainRound } from "@/lib/tracks.functions";
import { recordTrainRun, loadTrainHistory, type TrainRunRecord } from "@/lib/style-memory";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

// Seed mumble transcripts used for synthetic self-play training rounds.
export const TRAINING_SEEDS: { vibe: string; topic?: string; transcript: string }[] = [
  // === TRAP ===
  { vibe: "trap", topic: "late-night city money", transcript: "uh, yeah, I'm in the city late night driving, palm trees blurring past the windshield, uh phone keep ringing won't pick up, money on my mind got the city talking yeah, like, like, just signed the deal got my mama crying, brothers calling me from blocks I left behind yeah, uh, the same ones doubted now they hitting up, told 'em watch me work, watch me lock the pocket up" },
  { vibe: "trap", topic: "paranoia at the top", transcript: "yeah, can't sleep in the penthouse, glass too thin, every shadow on the wall feel like an old friend, uh, count the bands twice then I count 'em again, can't tell who real when the bag get this big, mm, mama keep praying, daddy keep saying watch your six, brother keep texting need a favor from me quick, I just want a quiet night, ice in the glass, but the game don't give you quiet when the money pass" },
  { vibe: "trap", topic: "flex / wins", transcript: "AP wet like the rain on the windshield uh, chain so cold make the AC feel mild yeah, just dropped a hundred on the rookie I'm wild, mama in Bel Air now she finally smile, uh, brother on the jet, sister own a brand, every Sunday family dinner in the islands man, I remember ramen noodles in the dark, now my dog the size of a Tesla in the yard" },

  // === DRILL ===
  { vibe: "drill", topic: "block politics", transcript: "yeah, on the block where the lights stay low, opps on the other side they know, gripping on the steel when the wind blow, money over everything, gotta let 'em know, uh, can't trust the bro that smile too wide, can't trust the night when the streets too quiet, we riding through the city with the motion, gotta keep the family in protection" },
  { vibe: "drill", topic: "loyalty", transcript: "uh, day one bro he ain't ask for a thing, we was eating off one plate when the pot was thin, now the chain on his neck got him singing, every move we make get the city ringing, mm, ain't no industry friend in the trenches, just the bros that was there when the rent was menace, we made it out but the block still feel close, every dub still go through the same door" },
  { vibe: "drill", topic: "ambition", transcript: "yeah I want it all, the house, the cars, the foreign plates, can't waste another summer on a small wage, uh, watching my city burn for a small page, every winter I add up another raised stake, the bro them counting on me to come through, the moms them counting on me to come through, can'fold, can't slow, can't switch, every door I open I drag the family in" },

  // === BOOM-BAP / LYRICAL ===
  { vibe: "boom-bap", topic: "city walking", transcript: "yo, walking through Brooklyn with the headphones on, beats in my chest from the morning long, sun cracking through the project glass, kids on the corner that grew up too fast, uh, every block tell a different story, every face hold a piece of the glory, I write what I see, I see what I know, the city my pen and the streets my flow" },
  { vibe: "boom-bap", topic: "father absence", transcript: "mm, pops left a number I never dialed, raised by a woman that worked through every cold, uh, learned to fix a tire from a YouTube clip, learned to tie a tie in the bathroom mirror, every man I became I stitched together, every lesson came late but I caught the weather, I don't hate him no more, I just don't know him, that's the line I been writing my whole life poem" },
  { vibe: "boom-bap", topic: "writing as therapy", transcript: "uh, this pen the only therapist I trust, ink the only friend that don't switch up, every notebook a year I survived, every bar a moment I kept inside, mm, my mama think I'm fine 'cause the songs sound smooth, my girl think I'm fine 'cause I show up on cue, but the booth know the truth I been holding in, that's the man you don't meet at the noise, just the page" },

  // === MELODIC RAP ===
  { vibe: "melodic", topic: "lonely fame", transcript: "I been chasing the sound in my head, fading lights, hotel beds, the world keep moving I'm standing still, writing songs nobody hear yet, mm, my reflection don't know my face, every city feel like the same place, I tell my mom I'm okay but my hands shake, I tell my friends I'm okay but my heart break" },
  { vibe: "melodic", topic: "growing apart", transcript: "yeah, we don't talk like we used to, you on a different time, I'm on a different mood, the group chat went quiet around June, everybody chasing somebody new, mm, I miss the nights we ain't have nothing to do, parking lot music, gas station food, now we just liking each other's posts, that's the love you keep when the love get ghost" },
  { vibe: "melodic", topic: "moving home", transcript: "drove past my old high school yesterday, parking lot empty, sky kind of grey, mm, thought about the kid I was at sixteen, scared of everybody, dreaming everything, yeah, told him in my head it gets better slow, told him in my head he was right to go, every dream he had I been holding for him, every promise I made I been folding in" },

  // === R&B ===
  { vibe: "rnb", topic: "after the breakup", transcript: "I been thinking about you, can'sleep at all, the way you left, the way I called, mm, the perfume on the pillow still, your shadow at the door, mm yeah, I drive past your block at 4 am, headlights low, hoping you'd come down again, yeah, this love a slow burn, but I keep coming back, I keep coming back" },
  { vibe: "rnb", topic: "new flame", transcript: "first time I saw you the room got slow, candle light moving on your collarbone, mm, you laughed at a joke that wasn't even mine, I knew right there I was running out of time, yeah, you the kind of woman make a grown man text twice, make a grown man rewrite the same line right, I been careful with my heart for a long year, you the first reason I been careless this year" },
  { vibe: "rnb", topic: "infidelity confession", transcript: "I been lying to you 'bout the late nights, I been lying to me 'bout the late nights, mm, she don't mean nothing but she mean the wrong thing, you the home I keep leaving in my own ring, yeah, I don't deserve the way you still wait up, I don't deserve the breakfast on the same cup, but you stay 'cause you love me through the worst me, I gotta become the man you been deserving" },

  // === AFROBEATS / DANCEHALL CROSSOVER ===
  { vibe: "afrobeats", topic: "dancefloor love", transcript: "girl you move like the drum tell you what to do, hips talking language only I can pursue, mm, Lagos to London the night still ours, sweat on the skin and the moon on the cars, yeah, baby don't think, baby don't blink, baby just follow the bassline I bring, every step you take got the floor underneath, every smile you make got the crew on repeat" },
  { vibe: "afrobeats", topic: "long distance", transcript: "you in Accra, I'm in Toronto cold, the time zone fighting every story told, mm, FaceTime grainy but your laugh stay loud, you the only weather I miss in the crowd, yeah, six more weeks till I land on your side, six more weeks till the wait turn alive, every flight delay feel like a heart attack, baby hold on, I'm coming, I'm coming back" },

  // === POP / RADIO ===
  { vibe: "pop", topic: "summer crush", transcript: "yeah it's only June and I'm already gone, every song on the radio sound like our song, mm, you in the passenger laughing too hard, windows down on the highway too far, yeah, I don't know where we going but I don't care, sunburned shoulders and salt in your hair, this the kind of summer I tell my kids about, this the kind of love I been writing without" },
  { vibe: "pop", topic: "comeback / glow up", transcript: "they ain't think I was coming back this year, they ain't think I was sounding this clear, mm, took a whole winter to find my voice, took a whole heartbreak to make the choice, yeah, every door they closed I built a new wall, every name they called I rewrote it all, this the album I been holding for a long time, this the version of me that finally feel mine" },

  // === HOOKS / CHANTABLE ===
  { vibe: "trap", topic: "hook-style chant", transcript: "all my brothers eating now, all my brothers eating now, told 'em hold on, hold on, hold on, all my brothers eating now, uh, mama crying happy tears, mama crying happy tears, told her hold on, hold on, hold on, mama crying happy tears, yeah, we ain't never going back, we ain't never going back, told 'em watch me, watch me, watch me, we ain't never going back" },
  { vibe: "rnb", topic: "hook-style chant", transcript: "stay with me, stay with me, the morning don't gotta come yet, stay with me, stay with me, the world outside can wait, mm, hold me close, hold me close, the rest of my life can start tomorrow, hold me close, hold me close, tonight you all I know, oh, just stay" },
];

export type StyleTrainingPanelProps = {
  config: LlmConfig;
  statsCount: number;
  statsAvgScore: number;
  onMemoryUpdate: () => void;
  onHistoryUpdate: () => void;
};

export function StyleTrainingPanel({
  config,
  statsCount,
  statsAvgScore,
  onMemoryUpdate,
  onHistoryUpdate,
}: StyleTrainingPanelProps) {
  const trainServer = useServerFn(trainRound);
  const [training, setTraining] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [trainProgress, setTrainProgress] = useState({ current: 0, total: 0, lastScore: 0, lastMessage: "" });
  const [trainRounds, setTrainRounds] = useState(10);

  async function runTraining() {
    setTraining(true);
    setStopRequested(false);
    setTrainProgress({ current: 0, total: trainRounds, lastScore: 0, lastMessage: "Starting…" });
    const startedAt = Date.now();
    let harvested = 0;
    let totalScore = 0;
    let scoredRounds = 0;
    let topScore = 0;
    let completed = 0;

    const shuffled = [...TRAINING_SEEDS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < trainRounds; i++) {
      if (stopRequested) break;
      const seed = shuffled[i % shuffled.length];
      setTrainProgress({
        current: i,
        total: trainRounds,
        lastScore: 0,
        lastMessage: `Round ${i + 1}/${trainRounds} (${seed.vibe})…`,
      });
      try {
        const examples = sampleStyleExamples(3, { vibe: seed.vibe });
        let result;
        if (config.providerId !== "lovable") {
          result = await runLocalPipeline(config, seed.transcript, undefined, (e) =>
            setTrainProgress((p) => ({ ...p, lastMessage: `Round ${i + 1}/${trainRounds}: ${e.message}` })),
          );
        } else {
          const r = await trainServer({
            data: { transcript: seed.transcript, styleBrief: undefined, styleExamples: examples },
          });
          result = r;
        }
        const score = (result.quality as { drakeScore?: number }).drakeScore ?? 0;
        totalScore += score;
        scoredRounds += 1;
        if (score > topScore) topScore = score;
        completed += 1;
        const bars = result.lyrics.sections.flatMap((s) => s.lines);
        const minThreshold = config.providerId !== "lovable" ? harvestThresholdFor(config) : 8.0;
        if (score >= minThreshold) {
          addToStyleMemory({
            title: result.lyrics.title,
            drakeScore: score,
            vibe: seed.vibe,
            bars,
            source: "self-play",
          });
          harvested += 1;
          onMemoryUpdate();
        }
        setTrainProgress({
          current: i + 1,
          total: trainRounds,
          lastScore: score,
          lastMessage: `Round ${i + 1}: ${score.toFixed(1)}/10 ${score >= minThreshold ? "✓ saved" : `(below ${minThreshold.toFixed(1)} threshold)`}`,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setTrainProgress((p) => ({ ...p, current: i + 1, lastMessage: `Round ${i + 1} failed: ${msg}` }));
      }
    }

    setTraining(false);
    const avg = scoredRounds ? totalScore / scoredRounds : 0;
    recordTrainRun({
      startedAt,
      endedAt: Date.now(),
      mode: isLocalConfig(config) ? "local" : "cloud",
      rounds: trainRounds,
      completed,
      harvested,
      avgScore: avg,
      topScore,
    });
    onHistoryUpdate();
    toast.success(
      `Training done. Harvested ${harvested} new examples · avg score ${avg.toFixed(1)}/10`,
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Self-Training</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{statsCount} examples</Badge>
          {statsCount > 0 && (
            <Badge variant="outline">avg {statsAvgScore.toFixed(1)}/10</Badge>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        The ghostwriter learns from its own best work. Every track that scores 8.0+ gets saved here
        and is injected as a few-shot example into future generations. Click <strong>Train</strong> to
        run synthetic rounds and grow the library on autopilot.
      </p>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-2 flex-1 max-w-[160px]">
          <Label htmlFor="rounds">Rounds</Label>
          <Input
            id="rounds"
            type="number"
            min={1}
            max={500}
            value={trainRounds}
            onChange={(e) => setTrainRounds(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
            disabled={training}
          />
        </div>
        {training ? (
          <Button variant="destructive" onClick={() => setStopRequested(true)}>
            <Square className="h-4 w-4 mr-2 fill-current" />
            Stop after current round
          </Button>
        ) : (
          <>
            <Button onClick={runTraining}>
              <Play className="h-4 w-4 mr-2" />
              Train ({getProvider(config.providerId).label})
            </Button>
            <Button variant="secondary" onClick={() => { setTrainRounds(25); setTimeout(runTraining, 0); }}>
              Quick · 25
            </Button>
            <Button variant="secondary" onClick={() => { setTrainRounds(100); setTimeout(runTraining, 0); }}>
              Heavy · 100
            </Button>
            <Button variant="secondary" onClick={() => { setTrainRounds(250); setTimeout(runTraining, 0); }}>
              Marathon · 250
            </Button>
          </>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Heavy/Marathon runs across {TRAINING_SEEDS.length} shuffled seeds (trap, drill, R&B, melodic, boom-bap, afrobeats, pop, hooks). Only bars scoring ≥8.0/10 are harvested into memory. Cloud mode burns credits per round — Local LLM mode is free.
      </p>

      {training && (
        <div className="space-y-2">
          <Progress value={(trainProgress.current / Math.max(1, trainProgress.total)) * 100} />
          <p className="text-xs text-muted-foreground">{trainProgress.lastMessage}</p>
        </div>
      )}
    </Card>
  );
}

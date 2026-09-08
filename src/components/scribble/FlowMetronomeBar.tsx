import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlowMetronomeBarProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  className?: string;
}

export function FlowMetronomeBar({
  bpm,
  onBpmChange,
  className,
}: FlowMetronomeBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const beatRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Wheel scroll to adjust BPM
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.shiftKey ? 5 : 1;
      const delta = e.deltaY < 0 ? step : -step;
      onBpmChange(Math.max(40, Math.min(240, bpm + delta)));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [bpm, onBpmChange]);

  // Web Audio click generator
  const playClick = useCallback((beat: number, time: number) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Beat 1: Accent (880Hz), Beats 2, 3, 4: Regular (440Hz)
      const freq = beat === 0 ? 880 : 440;
      const volume = beat === 0 ? 0.4 : 0.25;

      osc.frequency.setValueAtTime(freq, time);
      osc.type = "sine";

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    } catch {
      // AudioContext unavailable or blocked
    }
  }, [isMuted]);

  // Metronome scheduler loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentBeat(0);
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    beatRef.current = 0;

    const secondsPerBeat = 60.0 / bpm;

    const interval = window.setInterval(() => {
      if (!audioCtxRef.current) return;
      const now = audioCtxRef.current.currentTime;

      while (nextNoteTimeRef.current < now + 0.1) {
        const beatNum = beatRef.current % 4;
        playClick(beatNum, nextNoteTimeRef.current);

        // Schedule visual beat update
        const delayMs = Math.max(0, (nextNoteTimeRef.current - now) * 1000);
        setTimeout(() => {
          setCurrentBeat(beatNum);
        }, delayMs);

        nextNoteTimeRef.current += secondsPerBeat;
        beatRef.current += 1;
      }
    }, 25);

    timerRef.current = interval;

    return () => {
      clearInterval(interval);
      timerRef.current = null;
    };
  }, [isPlaying, bpm, playClick]);

  // Tap Tempo Handler
  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 2500);
    taps.push(now);
    tapTimesRef.current = taps;

    if (taps.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        diffs.push(taps[i] - taps[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const calculatedBpm = Math.round(60_000 / avgDiff);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card/80 border border-border/80 text-xs shadow-sm",
        className,
      )}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer",
          isPlaying
            ? "bg-amber-500 text-amber-950 font-bold shadow-sm animate-pulse"
            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
        title={isPlaying ? "Pause Flow Metronome" : "Start Flow Metronome"}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
      </button>

      {/* Hover & Scroll Wheel BPM Box */}
      <div
        ref={scrollRef}
        title="Scroll mouse wheel to change BPM (Shift + Scroll for ±5)"
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/70 border border-border/70 cursor-ns-resize select-none group hover:border-primary/60 transition-colors"
      >
        <span className="font-mono font-bold text-xs text-foreground tabular-nums min-w-[28px] text-center">
          {bpm}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          BPM
        </span>
      </div>

      {/* Visual 4-Beat Meter Dots */}
      <div className="flex items-center gap-1 px-1">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-75",
              isPlaying && currentBeat === b
                ? b === 0
                  ? "bg-primary scale-125 shadow-sm shadow-primary/50 ring-2 ring-primary/30"
                  : "bg-amber-400 scale-110 shadow-sm shadow-amber-400/50"
                : "bg-muted/40",
            )}
          />
        ))}
      </div>

      {/* Tap Tempo Button */}
      <button
        type="button"
        onClick={handleTapTempo}
        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border/40 transition-colors cursor-pointer"
        title="Tap repeatedly to set BPM"
      >
        Tap
      </button>

      {/* Mute/Sound Toggle */}
      <button
        type="button"
        onClick={() => setIsMuted(!isMuted)}
        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/40 transition-colors cursor-pointer"
        title={isMuted ? "Unmute click sound" : "Mute click sound"}
      >
        {isMuted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground/60" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
      </button>
    </div>
  );
}

// AudioPlayer — Interactive audio player with waveform & current bar timestamp sync.

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

export type AudioPlayerProps = {
  src: string;
  cadence?: { bars: { index: number; syllables: number; endSound: string; section: string; text: string }[] } | null;
  bpm?: number;
  onBarChange?: (barIndex: number) => void;
};

export function AudioPlayer({ src, cadence, bpm = 90, onBarChange }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  // Calculate current bar based on elapsed time & BPM (assuming 4 beats per bar)
  const secondsPerBar = (60 / bpm) * 4;
  const currentBarIndex = Math.floor(currentTime / secondsPerBar);

  useEffect(() => {
    onBarChange?.(currentBarIndex);
  }, [currentBarIndex, onBarChange]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Card className="p-4 space-y-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" onClick={togglePlay} className="h-9 w-9 shrink-0">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span className="font-medium text-foreground">
              {cadence?.bars[currentBarIndex] ? `Bar #${currentBarIndex + 1}` : ""}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <Button size="icon" variant="ghost" onClick={toggleMute} className="h-8 w-8 shrink-0 text-muted-foreground">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}

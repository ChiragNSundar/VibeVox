import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowMetronomeBar } from "../FlowMetronomeBar";

describe("FlowMetronomeBar Component", () => {
  beforeEach(() => {
    // Mock Web Audio API
    class MockAudioContext {
      currentTime = 0;
      createOscillator() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          frequency: { value: 0 },
        };
      }
      createGain() {
        return {
          connect: vi.fn(),
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
        };
      }
      destination = {};
      state = "running";
      resume = vi.fn().mockResolvedValue(undefined);
    }
    window.AudioContext = MockAudioContext as any;
  });

  it("renders BPM and title", () => {
    render(<FlowMetronomeBar bpm={90} onBpmChange={vi.fn()} />);
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("BPM")).toBeInTheDocument();
  });

  it("updates BPM on wheel scroll over BPM box", () => {
    const handleBpmChange = vi.fn();
    const { container } = render(
      <FlowMetronomeBar bpm={90} onBpmChange={handleBpmChange} />
    );

    const wheelTarget = container.querySelector("[title*='mouse wheel']") as HTMLElement;
    expect(wheelTarget).toBeInTheDocument();

    // Wheel scroll up (deltaY < 0) -> increment BPM by 1
    fireEvent.wheel(wheelTarget, { deltaY: -100, shiftKey: false });
    expect(handleBpmChange).toHaveBeenCalledWith(91);

    // Wheel scroll down with shift (deltaY > 0) -> decrement BPM by 5
    fireEvent.wheel(wheelTarget, { deltaY: 100, shiftKey: true });
    expect(handleBpmChange).toHaveBeenCalledWith(85);
  });

  it("clamps BPM to 40-240 bounds on wheel scroll", () => {
    const handleBpmChange = vi.fn();
    const { container } = render(
      <FlowMetronomeBar bpm={240} onBpmChange={handleBpmChange} />
    );

    const wheelTarget = container.querySelector("[title*='mouse wheel']") as HTMLElement;
    fireEvent.wheel(wheelTarget, { deltaY: -100 });
    expect(handleBpmChange).toHaveBeenCalledWith(240); // Clamped at 240
  });

  it("toggles play/stop state", () => {
    render(<FlowMetronomeBar bpm={120} onBpmChange={vi.fn()} />);
    const playBtn = screen.getByTitle("Start Flow Metronome");
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(screen.getByTitle("Pause Flow Metronome")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Pause Flow Metronome"));
    expect(screen.getByTitle("Start Flow Metronome")).toBeInTheDocument();
  });

  it("updates BPM via Tap Tempo button", () => {
    const handleBpmChange = vi.fn();
    render(<FlowMetronomeBar bpm={90} onBpmChange={handleBpmChange} />);

    const tapBtn = screen.getByRole("button", { name: /tap/i });
    expect(tapBtn).toBeInTheDocument();

    // Mock performance.now for predictable intervals (500ms = 120 BPM)
    let pNow = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => pNow);

    fireEvent.click(tapBtn);
    pNow += 500;
    fireEvent.click(tapBtn);

    expect(handleBpmChange).toHaveBeenCalledWith(120);
  });
});

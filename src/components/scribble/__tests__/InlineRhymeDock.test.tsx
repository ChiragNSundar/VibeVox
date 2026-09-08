import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InlineRhymeDock } from "../InlineRhymeDock";
import * as rhymesLib from "@/lib/rhymes";

vi.mock("@/lib/rhymes", () => ({
  lookupRhymes: vi.fn(),
  rhymeWaveUrl: vi.fn((w) => `https://www.rhymewave.com/#/${w}`),
}));

describe("InlineRhymeDock Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders idle hint when target word is empty or short", () => {
    render(<InlineRhymeDock targetWord="" onSelectWord={vi.fn()} />);
    expect(
      screen.getByText(/place cursor on any bar to see instant 1-click rhymes/i)
    ).toBeInTheDocument();
  });

  it("fetches and displays rhymes when valid word is provided", async () => {
    (rhymesLib.lookupRhymes as any).mockResolvedValue([
      { word: "fight", kind: "perfect", syllables: 1, score: 100 },
      { word: "bright", kind: "perfect", syllables: 1, score: 95 },
      { word: "ignite", kind: "perfect", syllables: 2, score: 90 },
      { word: "kite", kind: "near", syllables: 1, score: 70 },
    ]);

    const handleSelect = vi.fn();
    render(<InlineRhymeDock targetWord="light" onSelectWord={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByText("fight")).toBeInTheDocument();
      expect(screen.getByText("bright")).toBeInTheDocument();
      expect(screen.getByText("ignite")).toBeInTheDocument();
      expect(screen.getByText("kite")).toBeInTheDocument();
    });

    // Clicking a chip invokes onSelectWord
    fireEvent.click(screen.getByText("fight"));
    expect(handleSelect).toHaveBeenCalledWith("fight");
  });

  it("filters rhymes by tab", async () => {
    (rhymesLib.lookupRhymes as any).mockResolvedValue([
      { word: "fight", kind: "perfect", syllables: 1, score: 100 },
      { word: "kite", kind: "near", syllables: 1, score: 70 },
      { word: "ignite", kind: "perfect", syllables: 2, score: 90 },
    ]);

    render(<InlineRhymeDock targetWord="light" onSelectWord={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("fight")).toBeInTheDocument();
    });

    // Switch to Near Rhymes tab
    const nearTab = screen.getByRole("button", { name: /near/i });
    fireEvent.click(nearTab);

    expect(screen.getByText("kite")).toBeInTheDocument();
    expect(screen.queryByText("fight")).not.toBeInTheDocument();

    // Switch to Multi-Syllable tab
    const multiTab = screen.getByRole("button", { name: /multi/i });
    fireEvent.click(multiTab);

    expect(screen.getByText("ignite")).toBeInTheDocument();
    expect(screen.queryByText("kite")).not.toBeInTheDocument();
  });
});

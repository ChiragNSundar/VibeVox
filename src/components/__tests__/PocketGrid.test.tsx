import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PocketGrid } from "../PocketGrid";

describe("PocketGrid Component", () => {
  it("renders bar pocket items correctly", () => {
    const bars = [
      { index: 0, text: "Walking through the city with the bass down low", syllables: 12, endSound: "ow" },
      { index: 1, text: "Counting every second till the green lights show", syllables: 12, endSound: "ow" },
    ];

    render(<PocketGrid bars={bars} title="Test Syllable Grid" />);

    expect(screen.getByText("Test Syllable Grid")).toBeInTheDocument();
    expect(screen.getByText("Walking through the city with the bass down low")).toBeInTheDocument();
    expect(screen.getByText("Counting every second till the green lights show")).toBeInTheDocument();
  });
});

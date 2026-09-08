import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultiSelect, type MultiSelectOption } from "../multi-select";

const TEST_OPTIONS: MultiSelectOption[] = [
  { value: "trap", label: "Trap" },
  { value: "drill", label: "Drill" },
  { value: "boom-bap", label: "Boom-bap" },
  { value: "melodic", label: "Melodic rap" },
  { value: "rnb", label: "R&B" },
];

describe("MultiSelect Component", () => {
  it("renders placeholder when no options are selected", () => {
    render(
      <MultiSelect
        options={TEST_OPTIONS}
        selected={[]}
        onChange={vi.fn()}
        placeholder="Choose genres..."
      />,
    );

    expect(screen.getByText("Choose genres...")).toBeInTheDocument();
  });

  it("renders selected tag badges", () => {
    render(
      <MultiSelect
        options={TEST_OPTIONS}
        selected={["trap", "drill"]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Trap")).toBeInTheDocument();
    expect(screen.getByText("Drill")).toBeInTheDocument();
  });

  it("calls onChange when a tag close button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={TEST_OPTIONS}
        selected={["trap", "drill"]}
        onChange={handleChange}
      />,
    );

    const trapBadge = screen.getByText("Trap").closest("div");
    expect(trapBadge).toBeInTheDocument();
    const closeBtn = trapBadge?.querySelector("button");
    expect(closeBtn).toBeInTheDocument();

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleChange).toHaveBeenCalledWith(["drill"]);
    }
  });

  it("folds extra tags into +N more badge when exceeding maxVisibleTags", () => {
    render(
      <MultiSelect
        options={TEST_OPTIONS}
        selected={["trap", "drill", "boom-bap", "melodic"]}
        onChange={vi.fn()}
        maxVisibleTags={2}
      />,
    );

    expect(screen.getByText("Trap")).toBeInTheDocument();
    expect(screen.getByText("Drill")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("clears all selected options when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={TEST_OPTIONS}
        selected={["trap", "drill"]}
        onChange={handleChange}
        clearable={true}
      />,
    );

    const clearButton = screen.getByTitle("Clear all");
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith([]);
  });
});

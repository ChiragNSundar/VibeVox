import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BarRow } from "../track/BarRow";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("BarRow Component", () => {
  it("renders line text and responds to interactions", () => {
    const handleToggleLock = vi.fn();
    const handleAccept = vi.fn();

    render(
      <TooltipProvider>
        <BarRow
          line="Late night in the penthouse counting up the bands"
          bar={{ index: 0, syllables: 12, endSound: "anz", section: "verse", text: "mumble" }}
          got={12}
          gotEnd="anz"
          ok={true}
          locked={false}
          proposal={undefined}
          history={[]}
          rewriting={false}
          onRewrite={vi.fn()}
          onMoreAlternates={vi.fn()}
          onSelectAlternate={vi.fn()}
          onAccept={handleAccept}
          onRevert={vi.fn()}
          onToggleLock={handleToggleLock}
          onRestore={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByText("Late night in the penthouse counting up the bands")).toBeInTheDocument();

    const lockBtn = screen.getByTitle("Lock (protect from rewrites)");
    fireEvent.click(lockBtn);
    expect(handleToggleLock).toHaveBeenCalledTimes(1);
  });
});

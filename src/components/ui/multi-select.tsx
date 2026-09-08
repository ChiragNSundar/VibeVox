import * as React from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
};

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxVisibleTags?: number;
  className?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  clearable?: boolean;
  id?: string;
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  maxVisibleTags = 3,
  className,
  disabled = false,
  showSelectAll = true,
  clearable = true,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.badge && opt.badge.toLowerCase().includes(q)),
    );
  }, [options, search]);

  // Keep highlighted index in bounds
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Selected option objects
  const selectedOptions = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return selected
      .map((val) => map.get(val))
      .filter((o): o is MultiSelectOption => !!o);
  }, [options, selected]);

  const toggleOption = (value: string) => {
    if (disabled) return;
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (e: React.MouseEvent | React.KeyboardEvent, value: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter((v) => v !== value));
  };

  const clearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  const selectAllFiltered = () => {
    if (disabled) return;
    const allFilteredValues = filteredOptions
      .filter((o) => !o.disabled)
      .map((o) => o.value);
    const set = new Set([...selected, ...allFilteredValues]);
    onChange(Array.from(set));
  };

  // Keyboard navigation within list & search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
      scrollHighlightedIntoView(
        highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
      scrollHighlightedIntoView(
        highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1,
      );
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      if (open && filteredOptions[highlightedIndex]) {
        // Prevent toggle if space is typed inside search input
        if (e.key === " " && document.activeElement === inputRef.current && search.length > 0) {
          return;
        }
        e.preventDefault();
        const opt = filteredOptions[highlightedIndex];
        if (!opt.disabled) {
          toggleOption(opt.value);
        }
      } else if (!open) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    // Backspace deletes the last tag if search is empty
    if (e.key === "Backspace" && search === "" && selected.length > 0) {
      e.preventDefault();
      const last = selected[selected.length - 1];
      onChange(selected.filter((v) => v !== last));
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-multiselect-item]");
    const target = items[index] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({ block: "nearest" });
    }
  };

  const visibleSelected = selectedOptions.slice(0, maxVisibleTags);
  const hiddenCount = selectedOptions.length - maxVisibleTags;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-background/90 px-3 py-1.5 text-sm shadow-sm transition-all ring-offset-background cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            open && "border-primary/80 ring-1 ring-primary/40",
            className,
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-2">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground text-xs select-none">
                {placeholder}
              </span>
            ) : (
              <>
                {visibleSelected.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant="secondary"
                    className="flex items-center gap-1 text-[11px] font-medium py-0 px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {opt.icon && <opt.icon className="h-3 w-3 shrink-0" />}
                    <span className="truncate max-w-[120px]">{opt.label}</span>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => removeTag(e, opt.value)}
                      className="rounded-full hover:bg-primary/30 p-0.5 text-primary/80 hover:text-primary transition-colors focus:outline-none"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                {hiddenCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono py-0 px-1.5 text-muted-foreground border-dashed bg-muted/30"
                    title={selectedOptions
                      .slice(maxVisibleTags)
                      .map((o) => o.label)
                      .join(", ")}
                  >
                    +{hiddenCount} more
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
            {clearable && selected.length > 0 && !disabled && (
              <button
                type="button"
                tabIndex={-1}
                onClick={clearAll}
                title="Clear all"
                className="p-1 rounded-sm hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 shadow-xl border-border/80 bg-background/95 backdrop-blur-md rounded-lg"
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="flex items-center border-b border-border/60 px-3 py-2 gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Quick action bar */}
        {showSelectAll && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/40 text-[11px] text-muted-foreground">
            <span>
              {selected.length} of {options.length} selected
            </span>
            <div className="flex items-center gap-2">
              {filteredOptions.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-primary hover:underline font-medium"
                >
                  Select all
                </button>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="hover:text-foreground hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Options list */}
        <div
          ref={listRef}
          role="listbox"
          aria-multiselectable="true"
          className="max-h-60 overflow-y-auto p-1 text-xs space-y-0.5"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = selected.includes(opt.value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  data-multiselect-item
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => !opt.disabled && toggleOption(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer select-none transition-colors",
                    isHighlighted && "bg-accent text-accent-foreground",
                    isSelected && !isHighlighted && "bg-primary/5 text-foreground",
                    opt.disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border/80 bg-background/60",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </div>
                    {opt.icon && <opt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className={cn("truncate", isSelected && "font-medium")}>
                      {opt.label}
                    </span>
                  </div>

                  {opt.badge && (
                    <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                      {opt.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

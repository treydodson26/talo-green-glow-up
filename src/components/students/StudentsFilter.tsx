import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, ChevronDown } from "lucide-react";
import type { MembershipStatus, IntroRangeKey } from "@/data/student-types";
import { INTRO_RANGES } from "@/data/student-types";
import { cn } from "@/lib/utils";

interface StudentsFilterProps {
  search: string;
  setSearch: (v: string) => void;
  selectedStatuses: MembershipStatus[];
  setSelectedStatuses: (v: MembershipStatus[]) => void;
  selectedIntroRanges: IntroRangeKey[];
  setSelectedIntroRanges: (v: IntroRangeKey[]) => void;
  selectedTags: string[];
  setSelectedTags: (v: string[]) => void;
  availableTags: string[];
}

export function StudentsFilter(props: StudentsFilterProps) {
  const {
    search,
    setSearch,
    selectedStatuses,
    setSelectedStatuses,
    selectedIntroRanges,
    setSelectedIntroRanges,
    selectedTags,
    setSelectedTags,
    availableTags,
  } = props;

  // small debounce for search input
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => {
    const id = setTimeout(() => setSearch(localSearch), 180);
    return () => clearTimeout(id);
  }, [localSearch]);

  const statusOptions: MembershipStatus[] = ["Intro", "Member", "Churn Risk", "Inactive"];
  const hasTags = availableTags.length > 0;

  const toggle = <T,>(arr: T[], value: T) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const clearAll = () => {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedIntroRanges([]);
    setSelectedTags([]);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left: Search */}
      <div className="relative w-full md:max-w-sm">
        <Input
          placeholder="Search name, email, or phone"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-3 bg-background border-input"
          aria-label="Search students"
        />
      </div>

      {/* Right: Filters */}
      <div className="flex items-center gap-2">
        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Status
              {selectedStatuses.length > 0 && (
                <Badge variant="secondary">{selectedStatuses.length}</Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 bg-popover text-popover-foreground border shadow-md">
            <DropdownMenuLabel>Membership Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedStatuses(statusOptions)}>Select All</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedStatuses([])}>Clear</Button>
              </div>
              {statusOptions.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={selectedStatuses.includes(s)}
                  onCheckedChange={() => setSelectedStatuses(toggle(selectedStatuses, s))}
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Intro Day filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Intro Day
              {selectedIntroRanges.length > 0 && (
                <Badge variant="secondary">{selectedIntroRanges.length}</Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 bg-popover text-popover-foreground border shadow-md">
            <DropdownMenuLabel>Intro Day Ranges</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedIntroRanges(Object.keys(INTRO_RANGES) as IntroRangeKey[])}>Select All</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIntroRanges([])}>Clear</Button>
              </div>
              {(Object.keys(INTRO_RANGES) as IntroRangeKey[]).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={selectedIntroRanges.includes(key)}
                  onCheckedChange={() => setSelectedIntroRanges(toggle(selectedIntroRanges, key))}
                >
                  {INTRO_RANGES[key].label}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags filter */}
        {hasTags && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary">{selectedTags.length}</Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 bg-popover text-popover-foreground border shadow-md max-h-64 overflow-auto">
              <DropdownMenuLabel>Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <div className="flex items-center gap-2 mb-2">
                  <Button size="sm" variant="secondary" onClick={() => setSelectedTags(availableTags)}>Select All</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTags([])}>Clear</Button>
                </div>
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => setSelectedTags(toggle(selectedTags, tag))}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear all */}
        <Button variant="ghost" onClick={clearAll} aria-label="Clear all filters">
          Clear all
        </Button>
      </div>
    </div>
  );
}

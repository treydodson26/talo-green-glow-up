import { useMemo, useState } from "react";
import type { Student, MembershipStatus, IntroRangeKey } from "@/data/student-types";
import { INTRO_RANGES } from "@/data/student-types";
import { StudentsFilter } from "@/components/students/StudentsFilter";
import { StudentCard } from "@/components/students/StudentCard";

interface StudentsGridProps {
  students: Student[];
}

function matchesRanges(introDay: number | undefined, ranges: IntroRangeKey[]) {
  if (!ranges.length) return true;
  if (typeof introDay !== "number") return false;
  return ranges.some((key) => {
    const r = INTRO_RANGES[key];
    return introDay >= r.min && introDay <= r.max;
  });
}

export function StudentsGrid({ students }: StudentsGridProps) {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<MembershipStatus[]>([]);
  const [selectedIntroRanges, setSelectedIntroRanges] = useState<IntroRangeKey[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      for (const t of s.tags || []) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const hit = !q ||
        s.fullName.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.phone?.toLowerCase().includes(q) ?? false);

      if (!hit) return false;

      const statusOk = selectedStatuses.length === 0 || selectedStatuses.includes(s.membershipStatus);
      if (!statusOk) return false;

      const introOk = matchesRanges(s.introDay, selectedIntroRanges);
      if (!introOk) return false;

      const tagsOk = selectedTags.length === 0 || (s.tags && selectedTags.every((t) => s.tags.includes(t)));
      if (!tagsOk) return false;

      return true;
    });
  }, [students, search, selectedStatuses, selectedIntroRanges, selectedTags]);

  return (
    <section className="space-y-6">
      <StudentsFilter
        search={search}
        setSearch={setSearch}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        selectedIntroRanges={selectedIntroRanges}
        setSelectedIntroRanges={setSelectedIntroRanges}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        availableTags={availableTags}
      />

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <p>No students match your filters.</p>
          <button
            className="mt-3 underline text-foreground hover:opacity-80"
            onClick={() => {
              setSearch("");
              setSelectedStatuses([]);
              setSelectedIntroRanges([]);
              setSelectedTags([]);
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </section>
  );
}

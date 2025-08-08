import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Student, MembershipStatus } from "@/data/student-types";

function diffInDays(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toMembershipStatus(row: any, introDay?: number): MembershipStatus {
  const status = (row?.customer_status || "").toLowerCase();
  if (status === "active") return "Member";
  if (typeof introDay === "number" && introDay >= 0 && introDay <= 30) return "Intro";
  const lastSeen = row?.last_seen ? new Date(row.last_seen) : null;
  if (lastSeen) {
    const daysSince = diffInDays(new Date(), lastSeen);
    if (daysSince > 60) return "Inactive";
    if (daysSince > 30) return "Churn Risk";
  }
  return "Inactive";
}

export const MOCK_STUDENTS: Student[] = [
  {
    id: "mock-1",
    fullName: "Alex Rivera",
    email: "alex@example.com",
    phone: "+1 (555) 010-1001",
    avatarUrl: null,
    membershipStatus: "Intro",
    introOfferStart: new Date(Date.now() - 8 * 86400000).toISOString(),
    introDay: 8,
    lastSeen: new Date(Date.now() - 2 * 86400000).toISOString(),
    tags: ["yoga", "morning"],
    classes7d: 2,
    classes30d: 5,
  },
  {
    id: "mock-2",
    fullName: "Bri Chen",
    email: "bri@example.com",
    phone: "+1 (555) 010-1002",
    avatarUrl: null,
    membershipStatus: "Member",
    introOfferStart: null,
    introDay: undefined,
    lastSeen: new Date(Date.now() - 1 * 86400000).toISOString(),
    tags: ["evening", "flow"],
    classes7d: 3,
    classes30d: 10,
  },
  {
    id: "mock-3",
    fullName: "Casey Gupta",
    email: "casey@example.com",
    phone: "+1 (555) 010-1003",
    avatarUrl: null,
    membershipStatus: "Churn Risk",
    introOfferStart: null,
    introDay: undefined,
    lastSeen: new Date(Date.now() - 35 * 86400000).toISOString(),
    tags: ["prenatal"],
    classes7d: 0,
    classes30d: 0,
  },
];

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emily_customers")
        .select(
          [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "avatar_url",
            "customer_status",
            "first_seen",
            "customer_since",
            "last_seen",
            "marketing_consent",
            "tags",
          ].join(",")
        );

      if (error) {
        console.error("useStudents: failed to fetch emily_customers", { code: error.code, message: error.message, details: error.details });
        throw new Error(`Failed to load students: ${error.message}`);
      }

      const rows = Array.isArray(data) ? data : [];

      if (rows.length === 0) {
        // Fallback mock data for visibility
        return { students: MOCK_STUDENTS, usedMockData: true } as const;
      }

      const students: Student[] = rows.map((row: any) => {
        const fullName = `${row?.first_name ?? ""} ${row?.last_name ?? ""}`.trim();
        const startStr = row?.first_seen || row?.customer_since || null;
        const start = startStr ? new Date(startStr) : null;
        const introDay = start ? clamp(diffInDays(new Date(), start), 0, 30) : undefined;
        const membershipStatus = toMembershipStatus(row, introDay);
        const tags: string[] = Array.isArray(row?.tags)
          ? row.tags
          : typeof row?.tags === "string" && row.tags
          ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [];

        return {
          id: String(row.id),
          fullName,
          email: row?.email ?? null,
          phone: row?.phone ?? null,
          avatarUrl: row?.avatar_url ?? null,
          membershipStatus,
          introOfferStart: startStr,
          introDay,
          lastSeen: row?.last_seen ?? null,
          tags,
          classes7d: 0,
          classes30d: 0,
        } satisfies Student;
      });

      return { students, usedMockData: false } as const;
    },
    staleTime: 60_000,
  });
}

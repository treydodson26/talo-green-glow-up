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
  const status = (row?.status || "").toLowerCase();
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

export function useStudent(id?: string) {
  return useQuery({
    queryKey: ["student", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const numId = Number(id);
      const { data, error } = await supabase
        .from("customers")
        .select(
          [
            "id",
            "client_name",
            "first_name",
            "last_name",
            "client_email",
            "phone_number",
            "status",
            "first_seen",
            "last_seen",
            "tags",
          ].join(",")
        )
        .eq("id", Number.isFinite(numId) ? numId : -1)
        .maybeSingle();

      if (error) {
        console.error("useStudent: failed to fetch customer", { code: error.code, message: error.message, details: error.details });
        throw new Error(`Failed to load student: ${error.message}`);
      }

      if (!data) return null;

      const row: any = data as any;

      const baseName = (row?.client_name && String(row.client_name).trim().length > 0)
        ? String(row.client_name).trim()
        : `${row?.first_name ?? ""} ${row?.last_name ?? ""}`.trim();
      const fullName = baseName || "Unknown";
      const startStr = row?.first_seen || null;
      const start = startStr ? new Date(startStr) : null;
      const introDay = start ? clamp(diffInDays(new Date(), start), 0, 30) : undefined;
      const membershipStatus = toMembershipStatus(row, introDay);
      const tags: string[] = Array.isArray(row?.tags)
        ? row.tags
        : typeof row?.tags === "string" && row.tags
        ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const student: Student = {
        id: String(row.id),
        fullName,
        email: row?.client_email ?? null,
        phone: row?.phone_number ?? null,
        avatarUrl: null,
        membershipStatus,
        introOfferStart: startStr,
        introDay,
        lastSeen: row?.last_seen ?? null,
        tags,
        classes7d: 0,
        classes30d: 0,
      };

      return student;
    },
    staleTime: 60_000,
  });
}

export type MembershipStatus = "Intro" | "Member" | "Churn Risk" | "Inactive";

export type IntroRangeKey = "0-7" | "8-14" | "15-21" | "22-30";

export const INTRO_RANGES: Record<IntroRangeKey, { label: string; min: number; max: number }> = {
  "0-7": { label: "Days 0–7", min: 0, max: 7 },
  "8-14": { label: "Days 8–14", min: 8, max: 14 },
  "15-21": { label: "Days 15–21", min: 15, max: 21 },
  "22-30": { label: "Days 22–30", min: 22, max: 30 },
};

export interface Student {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  membershipStatus: MembershipStatus;
  introOfferStart?: string | null; // ISO
  introDay?: number; // 0-30
  lastSeen?: string | null; // ISO
  tags: string[];
  classes7d?: number; // stubbed
  classes30d?: number; // stubbed
}

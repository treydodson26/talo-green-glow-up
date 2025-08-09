import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, MessageSquare, Bot, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MessageModal from "@/components/MessageModal";
import { StudentAIChatDrawer } from "@/components/students/StudentAIChatDrawer";
import type { Student } from "@/data/student-types";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function formatPhone(p?: string | null) {
  return p || "";
}

function timeSince(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function statusBadgeVariant(status: Student["membershipStatus"]) {
  switch (status) {
    case "Member":
      return "secondary" as const;
    case "Intro":
      return "default" as const;
    case "Churn Risk":
      return "destructive" as const;
    case "Inactive":
    default:
      return "outline" as const;
  }
}

export function StudentCard({ student }: { student: Student }) {
  const navigate = useNavigate();
  const onOpen = () => navigate(`/student/${student.id}`);

  const showIntro = student.membershipStatus === "Intro" && typeof student.introDay === "number";
  const progress = showIntro ? Math.round(((student.introDay ?? 0) / 30) * 100) : 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover-scale focus:outline-none focus:ring-2 focus:ring-ring",
        "cursor-pointer"
      )}
      aria-label={`Open ${student.fullName} details`}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-1 ring-border shadow-sm">
              <AvatarImage src={student.avatarUrl || "/placeholder.svg"} alt={`${student.fullName} avatar`} loading="lazy" />
              <AvatarFallback>
                <UsersIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-base font-semibold leading-tight">{student.fullName}</div>
              <div className="text-sm text-muted-foreground truncate max-w-[220px]">
                {student.email || ""}
                {student.phone && (
                  <span>
                    {student.email ? " • " : null}
                    {formatPhone(student.phone)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={statusBadgeVariant(student.membershipStatus)}>
            {student.membershipStatus}
          </Badge>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-3">
          {showIntro && (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intro Day</span>
                <span className="font-medium">{student.introDay} of 30</span>
              </div>
              <Progress value={progress} className="h-2 mt-1" />
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">Classes this week</div>
            <div className="font-medium">{student.classes7d ?? 0}</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">Last seen</div>
            <div className="font-medium">{timeSince(student.lastSeen)}</div>
          </div>
        </div>

        {/* Footer tags */}
        {student.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {student.tags.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
            {student.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{student.tags.length - 4}</Badge>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

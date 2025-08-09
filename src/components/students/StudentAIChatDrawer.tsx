import { useState, useMemo, useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "@/data/student-types";
import { Loader2, Sparkles, Send, Users as UsersIcon } from "lucide-react";

interface StudentAIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function stripMarkdown(input: string): string {
  try {
    return input
      // Remove code fences and keep nothing inside blocks
      .replace(/```[\s\S]*?```/g, "")
      // Inline code: keep content, drop backticks
      .replace(/`([^`]*)`/g, "$1")
      // Headings
      .replace(/^#{1,6}\s+/gm, "")
      // Blockquotes
      .replace(/^>\s?/gm, "")
      // Bold/italics
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1")
      // Links [text](url) -> text
      .replace(/\[([^\]]*)\]\([^\)]*\)/g, "$1")
      // Lists bullets
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, (m) => m.replace(/\d+\.\s+/, ""))
      // Tables and HRs
      .replace(/^\|.*\|$/gm, (m) => m.replace(/\|/g, " ").trim())
      .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
      // Extra asterisks/underscores
      .replace(/[*_]{2,}/g, "")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return input;
  }
}

export function StudentAIChatDrawer({ open, onOpenChange, student }: StudentAIChatDrawerProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Seed with a helpful system message each time it's opened
      setMessages([
        {
          role: "system",
          content:
            `You are an assistant helping a yoga studio engage students.
Student context:\n- Name: ${student.fullName}\n- Status: ${student.membershipStatus}\n- Intro day: ${typeof student.introDay === "number" ? student.introDay : "n/a"}\n- Last seen: ${student.lastSeen ?? "n/a"}\n- Tags: ${(student.tags || []).join(", ") || "none"}\nProvide short, actionable, friendly suggestions.`,
        },
      ]);
      setInput("");
    }
  }, [open, student]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function handleSend() {
    if (!canSend) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("anthropic-generate", {
        body: {
          messages: [...messages, userMsg],
          temperature: 0.2,
          max_tokens: 512,
          use_db: true,
          student_id: Number.isFinite(Number(student.id)) ? Number(student.id) : undefined,
          student_email: student.email || undefined,
        },
      });

      if (error) {
        console.error("StudentAIChatDrawer anthropic-generate error", { error });
        toast({
          title: "AI error",
          description: error.message || "Failed to get AI response",
          variant: "destructive" as any,
        });
        return;
      }

      const text: string = (data as any)?.text || "";
      const cleaned = stripMarkdown(text);
      setMessages((m) => [...m, { role: "assistant", content: cleaned || "(no response)" }]);
    } catch (e: any) {
      console.error("StudentAIChatDrawer send failed", { message: e?.message, stack: e?.stack });
      toast({ title: "AI request failed", description: String(e?.message || e), variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-1 ring-border">
                <AvatarImage src={student.avatarUrl || "/placeholder.svg"} alt={`${student.fullName} avatar`} />
                <AvatarFallback>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle className="leading-none">{student.fullName}</DrawerTitle>
                <DrawerDescription className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{student.membershipStatus}</Badge>
                  {student.lastSeen && (
                    <span className="text-muted-foreground text-xs">Last seen {new Date(student.lastSeen).toLocaleDateString()}</span>
                  )}
                </DrawerDescription>
              </div>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Column */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">{student.fullName}'s AI Assistant</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInput(`Give me a short, friendly outreach idea for ${student.fullName}.`)}
                  >
                    Load Demo
                  </Button>
                </div>
                <ScrollArea className="h-[320px] p-4">
                  <div className="space-y-3">
                    {messages
                      .filter((m) => m.role !== "system")
                      .map((m, i) => (
                        <div
                          key={i}
                          className={
                            m.role === "user"
                              ? "ml-auto max-w-[80%] rounded-lg bg-primary/10 px-3 py-2 text-sm"
                              : "mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm"
                          }
                        >
                          {m.content}
                        </div>
                      ))}
                    {loading && (
                      <div className="mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-3 flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask about ${student.fullName}'s progress, challenges, or next best action…`}
                    rows={2}
                  />
                  <Button onClick={handleSend} disabled={!canSend} aria-label="Send">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Rail */}
            <aside className="space-y-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="text-sm font-medium mb-3">Context Library</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-medium truncate">{student.email || "—"}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm font-medium truncate">{student.phone || "—"}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Classes (7d)</div>
                    <div className="text-sm font-medium">{student.classes7d ?? 0}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Intro Day</div>
                    <div className="text-sm font-medium">{typeof student.introDay === "number" ? `${student.introDay}/30` : "—"}</div>
                  </div>
                </div>
                {student.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {student.tags.slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

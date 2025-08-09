import { useState, useMemo, useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "@/data/student-types";
import { Loader2, Sparkles } from "lucide-react";

interface StudentAIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

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
      setMessages((m) => [...m, { role: "assistant", content: text || "(no response)" }]);
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
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Ask AI about {student.fullName}
          </DrawerTitle>
          <DrawerDescription>
            Get concise ideas for outreach, retention, and next best actions.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-6">
          <div className="border rounded-xl bg-background/50">
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
                placeholder="Ask for a suggested message, follow-up, or action…"
                rows={2}
              />
              <Button onClick={handleSend} disabled={!canSend}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

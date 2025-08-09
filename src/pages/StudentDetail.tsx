import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Sparkles, Send, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStudent } from "@/hooks/use-student";

function setSEO(name?: string) {
  document.title = name ? `${name} • Student | Talo` : "Student | Talo";
  const metaDesc = document.querySelector('meta[name="description"]');
  const content = name ? `AI-assisted profile for ${name} with context and actions.` : `AI-assisted student profile.`;
  if (!metaDesc) {
    const m = document.createElement("meta");
    m.name = "description";
    m.content = content;
    document.head.appendChild(m);
  } else {
    metaDesc.setAttribute("content", content);
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    const l = document.createElement("link");
    l.rel = "canonical";
    l.href = window.location.href;
    document.head.appendChild(l);
  }
}

function stripMarkdown(input: string): string {
  try {
    return input
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^\)]*\)/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, (m) => m.replace(/\d+\.\s+/, ""))
      .replace(/^\|.*\|$/gm, (m) => m.replace(/\|/g, " ").trim())
      .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
      .replace(/[*_]{2,}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch { return input; }
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: student, isLoading, error } = useStudent(id);

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSEO(student?.fullName);
  }, [student?.fullName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (error) {
      toast({ title: "Failed to load student", description: String((error as any)?.message || error), variant: "destructive" as any });
      console.error("StudentDetail error", { error });
    }
  }, [error]);

  const canSend = input.trim().length > 0 && !loading && !!student;

  async function handleSend() {
    if (!student || !canSend) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("anthropic-generate", {
        body: {
          messages: [
            { role: "system", content: `You are a helpful studio assistant. Answer concisely and return plain text.` },
            ...messages,
            userMsg,
          ],
          temperature: 0.2,
          max_tokens: 512,
          use_db: true,
          student_id: Number(id),
          student_email: student.email || undefined,
        },
      });
      if (error) {
        console.error("StudentDetail anthropic-generate error", { error });
        toast({ title: "AI error", description: error.message || "Failed to get AI response", variant: "destructive" as any });
        return;
      }
      const cleaned = stripMarkdown((data as any)?.text || "");
      setMessages((m) => [...m, { role: "assistant", content: cleaned || "(no response)" }]);
    } catch (e: any) {
      console.error("StudentDetail send failed", { message: e?.message, stack: e?.stack });
      toast({ title: "AI request failed", description: String(e?.message || e), variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="animate-pulse h-32 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container max-w-3xl py-8">
        <Button variant="secondary" onClick={() => navigate("/students")}>Back to Students</Button>
        <p className="mt-4 text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-background-subtle to-background border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-border">
              <AvatarImage src={student.avatarUrl || "/placeholder.svg"} alt={`${student.fullName} avatar`} />
              <AvatarFallback><UsersIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold leading-tight">{student.fullName}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm">
                <Badge variant="secondary">{student.membershipStatus}</Badge>
                {student.lastSeen && <span className="text-muted-foreground">Last seen {new Date(student.lastSeen).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/students")}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Assistant */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle>{student.fullName}'s AI Assistant</CardTitle>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setInput(`Give me a short, friendly outreach idea for ${student.fullName}.`)}>Load Demo</Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl">
                <ScrollArea className="h-[360px] p-4">
                  <div className="space-y-3">
                    {messages.map((m, i) => (
                      <div key={i} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-lg bg-primary/10 px-3 py-2 text-sm" : "mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm"}>
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
                    placeholder={`Ask about ${student.fullName}'s status, recent activity, or next best action…`}
                    rows={2}
                  />
                  <Button onClick={handleSend} disabled={!canSend} aria-label="Send">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Rail */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Context Library</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <div className="text-xs text-muted-foreground">Intro Day</div>
                  <div className="text-sm font-medium">{typeof student.introDay === "number" ? `${student.introDay}/30` : "—"}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Classes (7d)</div>
                  <div className="text-sm font-medium">{student.classes7d ?? 0}</div>
                </div>
              </div>
              {student.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {student.tags.slice(0, 8).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

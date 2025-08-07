import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, Sparkles, BarChart3 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  table?: { title: string; columns: string[]; rows: any[][] } | null;
}

const quickActions = [
  { label: "Show top customers this month", action: "top_customers_month" },
  { label: "Class attendance trends", action: "attendance_trends" },
  { label: "Revenue summary", action: "revenue_summary" },
  { label: "Customers at risk of churning", action: "churn_risk" },
] as const;

export default function BIDashboard() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Basic SEO
  useEffect(() => {
    const prevTitle = document.title;
    const prevMeta = document.querySelector('meta[name="description"]');
    const metaTag = prevMeta || Object.assign(document.createElement("meta"), { name: "description" });
    if (!prevMeta) document.head.appendChild(metaTag);

    document.title = "Yoga BI – AI Insights Dashboard";
    metaTag.setAttribute("content", "Ask questions about your studio: customers, classes, revenue, and churn risk.");

    // Canonical
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);

    return () => {
      document.title = prevTitle;
      if (prevMeta) metaTag.setAttribute("content", prevMeta.getAttribute("content") || "");
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async (q: string, action?: string) => {
    try {
      setLoading(true);
      setMessages((m) => [...m, { role: "user", content: q }]);

      const { data, error } = await supabase.functions.invoke("ai-query", {
        body: { question: q, action },
      });

      if (error) {
        console.error("ai-query error:", error, data);
        toast({ title: "Query failed", description: error.message || "Unknown error", variant: "destructive" });
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that request." }]);
        return;
      }

      if (data?.type === "table") {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.title || "",
            table: { title: data.title, columns: data.columns || [], rows: data.rows || [] },
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data?.text || data?.title || "" }]);
      }

      toast({ title: "Done", description: "Insight generated" });
    } catch (e: any) {
      console.error("Unhandled ai-query error:", e);
      toast({ title: "Unexpected error", description: e?.message || "", variant: "destructive" });
      setMessages((m) => [...m, { role: "assistant", content: "An unexpected error occurred." }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const q = input.trim();
    setInput("");
    await send(q);
  };

  return (
    <div className="min-h-screen bg-background-subtle">
      <main className="mx-auto max-w-6xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {quickActions.map((qa) => (
                <Button key={qa.action} variant="secondary" onClick={() => send(qa.label, qa.action)}>
                  <Sparkles className="h-4 w-4 mr-2" /> {qa.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ask natural questions like "Who are my top customers?" or click a quick insight. Results appear on the right.
            </CardContent>
          </Card>
        </aside>

        {/* Chat Area */}
        <section className="md:col-span-8">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>AI Business Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm mt-8">
                  Start by asking a question about your studio.
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={
                    m.role === "user"
                      ? "inline-block px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                      : "inline-block px-3 py-2 rounded-lg bg-muted"
                  }>
                    {m.content}
                  </div>

                  {m.table && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium mb-2">{m.table.title}</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {m.table.columns.map((c, idx) => (
                                <TableHead key={idx}>{c}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {m.table.rows.map((r, ridx) => (
                              <TableRow key={ridx}>
                                {r.map((cell, cidx) => (
                                  <TableCell key={cidx}>{String(cell ?? "")}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </CardContent>
            <CardFooter>
              <form onSubmit={onSubmit} className="flex w-full items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about customers, classes, revenue..."
                  className="flex-1 h-24"
                />
                <Button type="submit" disabled={!canSend}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, ArrowRight } from "lucide-react";

const models = [
  { id: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet (2025-05 latest)" },
  { id: "claude-opus-4-20250514", label: "Claude 4 Opus (2025-05 advanced)" },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (2024-10 fast)" },
  { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet (2024-06)" },
];

export default function AIPlayground() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("You are a concise studio assistant helping with marketing copy.");
  const [model, setModel] = useState(models[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  // Basic SEO for this page
  useEffect(() => {
    const prevTitle = document.title;
    const prevMeta = document.querySelector('meta[name="description"]');
    const metaTag = prevMeta || Object.assign(document.createElement("meta"), { name: "description" });
    if (!prevMeta) document.head.appendChild(metaTag);

    document.title = "AI Playground – Claude Text Generator";
    metaTag.setAttribute("content", "Test Anthropic Claude models from your dashboard: prompt, system, temperature, and tokens with instant results.");

    return () => {
      document.title = prevTitle;
      metaTag.setAttribute("content", prevMeta?.getAttribute("content") || "");
    };
  }, []);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  const run = async () => {
    try {
      setLoading(true);
      setOutput("");
      const { data, error } = await supabase.functions.invoke("anthropic-generate", {
        body: {
          prompt: prompt.trim(),
          model,
          temperature,
          max_tokens: maxTokens,
          system,
        },
      });

      if (error) {
        // Capture details from the Edge Function response body when available
        const body = data as any;
        console.error("anthropic-generate error:", error, body);
        setOutput(typeof body === "string" ? body : JSON.stringify(body, null, 2));
        toast({
          title: "Generation failed",
          description: body?.error ? `${body.error} (${body.status || ''})` : (error.message || "Unknown error"),
          variant: "destructive",
        });
        return;
      }

      const text = data?.text || "";
      setOutput(text);
      toast({ title: "Generated", description: "Claude returned a response." });
    } catch (e: any) {
      console.error("Unhandled error invoking anthropic-generate:", e);
      toast({
        title: "Unexpected error",
        description: e?.message || "Check function logs for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({ title: "Copied", description: "Response copied to clipboard." });
    } catch (e: any) {
      toast({ title: "Copy failed", description: e?.message || "", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background-subtle">
      <main className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Claude AI Playground</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate text via Anthropic securely through Supabase Edge Functions.</p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model" className="mt-1">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min={0}
                    max={2}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={1}
                    max={4000}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="system">System (optional)</Label>
              <Textarea
                id="system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="e.g., You speak in a friendly, professional tone."
                className="mt-1 h-24"
              />
            </div>

            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write a 2‑line welcome for prenatal class attendees."
                className="mt-1 h-40"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={run} disabled={!canSubmit}>
              Generate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea readOnly value={output} className="h-56" placeholder="Response will appear here..." />
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">Uses secure Edge Function anthropic-generate</p>
            <Button variant="secondary" size="sm" onClick={copyOut} disabled={!output}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  Download, 
  Loader2, 
  Wand2, 
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GeneratedFlyer {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

const FlyerGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [flyerType, setFlyerType] = useState("class-promotion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlyers, setGeneratedFlyers] = useState<GeneratedFlyer[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const flyerTemplates = {
    "class-promotion": "Create a yoga studio flyer promoting new classes. Include elegant yoga poses, calming colors (soft greens, blues, whites), modern typography, and space for class schedule. Professional studio aesthetic with peaceful, zen-like atmosphere.",
    "seasonal-special": "Design a seasonal yoga special offer flyer. Use seasonal colors and elements, yoga imagery, promotional pricing layout, clean modern design with Tallow Yoga branding. Peaceful and inviting atmosphere.",
    "intro-offer": "Create a beginner-friendly yoga intro offer flyer. Show welcoming yoga poses, soft calming colors, clear pricing ($49 for 8 classes), beginner-focused messaging, clean professional layout.",
    "workshop": "Design a yoga workshop flyer. Include specialized yoga poses, workshop details layout, premium elegant design, earthy natural colors, artistic typography with spiritual elements.",
    "retreat": "Create a yoga retreat promotional flyer. Show serene nature scenes with yoga elements, travel-inspired design, luxury spa aesthetic, calming earth tones and peaceful imagery."
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your flyer",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Combine template with user prompt
      const baseTemplate = flyerTemplates[flyerType as keyof typeof flyerTemplates];
      const fullPrompt = `${baseTemplate} User requirements: ${prompt}. Style: Professional marketing flyer, high quality, print-ready design.`;

      console.log("Generating flyer with prompt:", fullPrompt);

      const { data, error } = await supabase.functions.invoke('generate-flyer', {
        body: { prompt: fullPrompt }
      });

      if (error) throw error;

      const newFlyer: GeneratedFlyer = {
        id: crypto.randomUUID(),
        prompt: prompt,
        imageUrl: data.image,
        createdAt: new Date().toISOString()
      };

      setGeneratedFlyers(prev => [newFlyer, ...prev]);
      setPrompt("");

      toast({
        title: "Flyer generated successfully!",
        description: "Your marketing flyer is ready to use.",
      });

    } catch (error) {
      console.error("Error generating flyer:", error);
      toast({
        title: "Error generating flyer",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (flyerPrompt: string, id: string) => {
    navigator.clipboard.writeText(flyerPrompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    
    toast({
      title: "Prompt copied",
      description: "Flyer prompt copied to clipboard",
    });
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `tallow-yoga-flyer-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your flyer is being downloaded",
      });
    } catch (error) {
      console.error("Error downloading flyer:", error);
      toast({
        title: "Download failed",
        description: "Could not download the flyer. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Flyer Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flyerType">Flyer Type</Label>
              <Select value={flyerType} onValueChange={setFlyerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flyer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class-promotion">Class Promotion</SelectItem>
                  <SelectItem value="seasonal-special">Seasonal Special</SelectItem>
                  <SelectItem value="intro-offer">Intro Offer</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="retreat">Retreat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Flyer Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe your flyer content (e.g., 'Back to school special - 30% off new student packages, September classes starting')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Flyer...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Flyer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Flyers */}
      {generatedFlyers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Generated Flyers ({generatedFlyers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedFlyers.map((flyer) => (
                <div key={flyer.id} className="space-y-3">
                  <div className="relative group">
                    <img 
                      src={flyer.imageUrl} 
                      alt="Generated flyer"
                      className="w-full aspect-[4/5] object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(flyer.imageUrl, flyer.prompt)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyPrompt(flyer.prompt, flyer.id)}
                      >
                        {copiedId === flyer.id ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        {copiedId === flyer.id ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-2">{flyer.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(flyer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {generatedFlyers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No flyers generated yet</h3>
            <p className="text-muted-foreground">
              Create your first AI-generated marketing flyer using the form above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlyerGenerator;
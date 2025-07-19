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
  Check,
  Settings,
  ExternalLink
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
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
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

    if (!n8nWebhookUrl) {
      toast({
        title: "Error", 
        description: "Please configure your n8n webhook URL first",
        variant: "destructive"
      });
      setShowWebhookConfig(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Combine template with user prompt
      const baseTemplate = flyerTemplates[flyerType as keyof typeof flyerTemplates];
      const fullPrompt = `${baseTemplate} User requirements: ${prompt}. Style: Professional marketing flyer, high quality, print-ready design.`;

      console.log("Sending to n8n webhook:", n8nWebhookUrl);
      console.log("Prompt:", fullPrompt);

      // Call n8n webhook with the expected payload structure
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          prompt: fullPrompt,
          title: `Tallow-Yoga-${flyerType}-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      // n8n workflow returns the Google Drive link
      const data = await response.text(); // The webhook responds with just the URL
      console.log("n8n response:", data);

      const newFlyer: GeneratedFlyer = {
        id: crypto.randomUUID(),
        prompt: prompt,
        imageUrl: data.trim(), // Google Drive link
        createdAt: new Date().toISOString()
      };

      setGeneratedFlyers(prev => [newFlyer, ...prev]);
      setPrompt("");

      toast({
        title: "Flyer generated successfully!",
        description: "Your marketing flyer has been created and saved to Google Drive.",
      });

    } catch (error) {
      console.error("Error generating flyer:", error);
      toast({
        title: "Error generating flyer",
        description: "Please check your n8n webhook URL and try again.",
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
      {/* n8n Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            n8n Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showWebhookConfig && n8nWebhookUrl ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  n8n webhook configured
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowWebhookConfig(true)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Update
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">n8n Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-n8n-instance.com/webhook/20bd4317-eabe-4e69-8932-0199a7e60418"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your n8n webhook URL that triggers the image generation workflow
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowWebhookConfig(false)}
                  disabled={!n8nWebhookUrl}
                >
                  Save Configuration
                </Button>
                {showWebhookConfig && n8nWebhookUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowWebhookConfig(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            disabled={isGenerating || !prompt.trim() || !n8nWebhookUrl}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Flyer via n8n...
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
                         onClick={() => window.open(flyer.imageUrl, '_blank')}
                       >
                         <ExternalLink className="w-4 h-4 mr-1" />
                         Open in Drive
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
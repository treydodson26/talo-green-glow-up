import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, Users, MessageSquare } from "lucide-react";

const NewsletterGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    tone: "",
    targetAudience: ""
  });
  const { toast } = useToast();

  // Predefined tone options for the dropdown
  const toneOptions = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual & Friendly" },
    { value: "informative", label: "Informative" },
    { value: "inspiring", label: "Inspiring & Motivational" },
    { value: "educational", label: "Educational" },
    { value: "conversational", label: "Conversational" },
    { value: "authoritative", label: "Authoritative" },
    { value: "warm", label: "Warm & Personal" }
  ];

  // Predefined audience suggestions for yoga studio
  const audienceSuggestions = [
    "New yoga practitioners and beginners",
    "Experienced yogis seeking advanced practices", 
    "Busy professionals looking for stress relief",
    "Seniors interested in gentle movement",
    "Parents seeking family-friendly wellness",
    "Athletes using yoga for cross-training",
    "Meditation enthusiasts and mindfulness seekers",
    "Health-conscious individuals focused on wellness"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateNewsletter = async () => {
    // Validate required fields
    if (!formData.topic.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a newsletter topic",
        variant: "destructive",
      });
      return;
    }

    if (!formData.tone) {
      toast({
        title: "Missing Information", 
        description: "Please select a tone for the newsletter",
        variant: "destructive",
      });
      return;
    }

    if (!formData.targetAudience.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify the target audience",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Send data to n8n webhook
      const webhookUrl = "https://mvanish-assistant.app.n8n.cloud/webhook/831ed3a0-ebaa-47a0-af27-1ef073a1e5aa";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Topic: formData.topic,
          Tone: formData.tone,
          "Target Audience": formData.targetAudience,
          timestamp: new Date().toISOString(),
          source: "talo-crm"
        }),
      });

      if (response.ok) {
        toast({
          title: "Newsletter Generation Started! 🎉",
          description: "Your newsletter is being created and will be sent via email when ready. This usually takes 2-3 minutes.",
        });

        // Reset form
        setFormData({
          topic: "",
          tone: "",
          targetAudience: ""
        });
      } else {
        throw new Error("Failed to start newsletter generation");
      }
    } catch (error) {
      console.error("Error generating newsletter:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to start newsletter generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          Newsletter Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create AI-powered newsletters tailored to your yoga community
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Newsletter Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Newsletter Topic
          </Label>
          <Input
            id="topic"
            placeholder="e.g., 'Benefits of Morning Yoga' or 'Mindfulness for Beginners'"
            value={formData.topic}
            onChange={(e) => handleInputChange("topic", e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Newsletter Tone
          </Label>
          <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select the tone for your newsletter" />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="audience" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Target Audience
          </Label>
          <Textarea
            id="audience"
            placeholder="Describe your target audience (e.g., 'Busy professionals looking for stress relief and work-life balance')"
            value={formData.targetAudience}
            onChange={(e) => handleInputChange("targetAudience", e.target.value)}
            className="bg-background min-h-[80px]"
          />
          
          {/* Audience Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {audienceSuggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-primary/5 hover:bg-primary/10 border-primary/20"
                  onClick={() => handleInputChange("targetAudience", suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateNewsletter}
          disabled={isGenerating}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating Newsletter...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Newsletter Draft
            </>
          )}
        </Button>

        {/* Info Text */}
        <div className="text-xs text-muted-foreground space-y-1 bg-primary/5 p-3 rounded-lg">
          <p className="font-medium">How it works:</p>
          <ul className="space-y-1 ml-4">
            <li>• AI researches current trends related to your topic</li>
            <li>• Creates engaging sections tailored to your audience</li>
            <li>• Generates a complete newsletter with citations</li>
            <li>• Sends the final result to your email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsletterGenerator;
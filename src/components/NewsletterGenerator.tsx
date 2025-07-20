import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, Users, MessageSquare, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const NewsletterGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    tone: "",
    targetAudience: "",
    purpose: ""
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
      const webhookUrl = "https://treydodson26.app.n8n.cloud/webhook-test/831ed3a0-ebaa-47a0-af27-1ef073a1e5aa";
      
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
          targetAudience: "",
          purpose: ""
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
            📧
          </div>
          Newsletter Campaign Generator
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
            placeholder="e.g., Stress Relief & Mindfulness"
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
              <SelectItem value="warm-encouraging">Warm & Encouraging</SelectItem>
              <SelectItem value="motivational">Motivational</SelectItem>
              <SelectItem value="inspiring">Inspiring</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual-friendly">Casual & Friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Target Audience
          </Label>
          <Select value={formData.targetAudience} onValueChange={(value) => handleInputChange("targetAudience", value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Who should receive this newsletter?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-customers">All Customers</SelectItem>
              <SelectItem value="intro-period">Intro Period Customers</SelectItem>
              <SelectItem value="active-members">Active Members</SelectItem>
              <SelectItem value="inactive-members">Inactive Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Newsletter Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Newsletter Purpose
          </Label>
          <Textarea
            id="purpose"
            placeholder="Describe what you want to achieve with this newsletter..."
            value={formData.purpose || ""}
            onChange={(e) => handleInputChange("purpose", e.target.value)}
            className="bg-background min-h-[100px]"
          />
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
              Generate Newsletter
            </>
          )}
        </Button>

        {/* Empty State */}
        <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No newsletters generated yet</h3>
          <p className="text-muted-foreground">
            Create your first AI-generated newsletter using the form above
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsletterGenerator;
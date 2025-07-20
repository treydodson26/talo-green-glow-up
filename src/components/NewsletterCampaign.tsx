import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Heart, Flower2, Send, Sparkles } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(1, "Newsletter topic is required"),
  tone: z.string().min(1, "Please select a tone"),
  targetAudience: z.string().min(1, "Please select target audience"),
  purpose: z.string().min(10, "Please describe the purpose in at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

const NewsletterCampaign = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      tone: "",
      targetAudience: "",
      purpose: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("https://treydodson26.app.n8n.cloud/webhook/831ed3a0-ebaa-47a0-af27-1ef073a1e5aa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: data.topic,
          tone: data.tone,
          targetAudience: data.targetAudience,
          purpose: data.purpose,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        form.reset();
        toast({
          title: "Success!",
          description: "Newsletter is being generated! You'll receive it in your inbox shortly.",
        });
      } else {
        throw new Error("Failed to generate newsletter");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate newsletter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg border-sage-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-sage-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-sage-800">Newsletter is being generated!</h3>
              <p className="text-sage-600">You'll receive it in your inbox shortly.</p>
              <Button 
                onClick={() => setShowSuccess(false)}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                Create Another Newsletter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Flower2 className="w-8 h-8 text-sage-600" />
            <h1 className="text-3xl font-bold text-sage-800">Newsletter Campaign</h1>
            <Heart className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sage-600 text-lg">Create engaging newsletters that inspire and connect with your yoga community</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-sage-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-sage-100 to-orange-100 rounded-t-lg">
            <CardTitle className="text-sage-800 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Design Your Newsletter
            </CardTitle>
            <CardDescription className="text-sage-600">
              Fill in the details below to create a personalized newsletter for your yoga studio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Newsletter Topic */}
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sage-700 font-medium">Newsletter Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Stress Relief & Mindfulness"
                          {...field}
                          className="border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Newsletter Tone */}
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sage-700 font-medium">Newsletter Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-sage-200 focus:border-sage-400 focus:ring-sage-400">
                            <SelectValue placeholder="Select the tone for your newsletter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="warm-encouraging">Warm & Encouraging</SelectItem>
                          <SelectItem value="motivational">Motivational</SelectItem>
                          <SelectItem value="inspiring">Inspiring</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual-friendly">Casual & Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Audience */}
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sage-700 font-medium">Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-sage-200 focus:border-sage-400 focus:ring-sage-400">
                            <SelectValue placeholder="Who should receive this newsletter?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all-customers">All Customers</SelectItem>
                          <SelectItem value="intro-period">Intro Period Customers</SelectItem>
                          <SelectItem value="active-members">Active Members</SelectItem>
                          <SelectItem value="inactive-members">Inactive Members</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Newsletter Purpose */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sage-700 font-medium">Newsletter Purpose</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what you want to achieve with this newsletter..."
                          className="border-sage-200 focus:border-sage-400 focus:ring-sage-400 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white font-medium py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Generating Newsletter...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Generate Newsletter
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-sage-500 text-sm flex items-center justify-center gap-2">
            <Flower2 className="w-4 h-4" />
            Creating mindful connections through thoughtful communication
            <Flower2 className="w-4 h-4" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterCampaign;
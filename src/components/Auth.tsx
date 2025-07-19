import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthProps {
  onSuccess?: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(true);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email!",
        description: "We sent you a login link. Check your email and click the link to sign in.",
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      toast({
        title: "Signed in!",
        description: "You're now signed in anonymously and can send WhatsApp messages.",
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Anonymous auth error:', error);
      toast({
        title: "Anonymous sign-in failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Welcome to Talo Yoga CRM
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Please sign in to send WhatsApp messages
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            variant="black"
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Send Magic Link
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or for demo
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleAnonymousSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Continue as Guest
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
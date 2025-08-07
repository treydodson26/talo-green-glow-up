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
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(true);
  const { toast } = useToast();

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({ title: "Error", description: "Enter email and password", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = isSigningIn ? await signIn() : await signUp();
      if (error) throw error;

      toast({
        title: isSigningIn ? "Signed in" : "Check your email",
        description: isSigningIn
          ? "You're now signed in."
          : "We sent a confirmation link. After confirming, you'll be redirected.",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({ title: "Authentication failed", description: error.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast({ title: "Signed in!", description: "You're now signed in anonymously." });
      onSuccess?.();
    } catch (error: any) {
      console.error("Anonymous auth error:", error);
      toast({ title: "Anonymous sign-in failed", description: error.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" role="form" aria-label="Authentication form">
      <CardHeader>
        <CardTitle className="text-center">Welcome to Talo Yoga CRM</CardTitle>
        <p className="text-center text-muted-foreground">Sign in to access insights and tools</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" variant="black" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSigningIn ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {isSigningIn ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isSigningIn ? "Sign in" : "Create account"}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button type="button" className="text-primary underline" onClick={() => setIsSigningIn((v) => !v)}>
            {isSigningIn ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or for demo</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleAnonymousSignIn} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Continue as Guest
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
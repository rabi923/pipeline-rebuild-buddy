import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Leaf, Heart } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"food_giver" | "food_receiver">("food_receiver");

  useEffect(() => {
    checkExistingSession();
  }, [navigate]);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        // Profile exists, redirect based on role
        if (profile.role === 'food_giver') {
          navigate('/giver-dashboard', { replace: true });
        } else if (profile.role === 'food_receiver') {
          navigate('/receiver-dashboard', { replace: true });
        }
      } else {
        // Profile doesn't exist, sign out and let them re-register
        await supabase.auth.signOut();
        toast.error('Profile not found. Please sign up again.');
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('Failed to fetch profile');
        }

        if (!profile) {
          // Profile doesn't exist - this shouldn't happen
          await supabase.auth.signOut();
          toast.error('Profile not found. Please contact support or sign up again.');
          return;
        }

        toast.success("Welcome back!");

        // Redirect based on role
        if (profile.role === 'food_giver') {
          navigate('/giver-dashboard', { replace: true });
        } else {
          navigate('/receiver-dashboard', { replace: true });
        }

      } else {
        // SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast.success("Account created! Redirecting...");

        // Redirect based on role
        if (role === 'food_giver') {
          navigate('/giver-dashboard', { replace: true });
        } else {
          navigate('/receiver-dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">FoodShare</CardTitle>
          <CardDescription className="text-base">
            {isLogin ? "Welcome back! Sign in to continue" : "Join us in reducing food waste"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="h-12 text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <Label className="text-base">I want to:</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as any)}>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem value="food_receiver" id="receiver" />
                    <Label htmlFor="receiver" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-secondary" />
                        <span className="font-medium">Receive Food</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Find and collect available food</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem value="food_giver" id="giver" />
                    <Label htmlFor="giver" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-primary" />
                        <span className="font-medium">Share Food</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Donate excess food to those in need</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 text-base"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

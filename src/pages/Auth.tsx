
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('User authenticated, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('User already authenticated, redirecting to dashboard');
        navigate('/dashboard');
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-pos-primary">POS Tenet</CardTitle>
          <CardDescription>
            Manage your business with our modern POS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetMode ? (
            <ForgotPasswordForm
              onBackToSignIn={() => setResetMode(false)}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            
              <TabsContent value="signin">
                <LoginForm
                  onForgotPassword={() => setResetMode(true)}
                  loading={loading}
                  setLoading={setLoading}
                />
              </TabsContent>
            
              <TabsContent value="signup">
                <SignUpForm
                  loading={loading}
                  setLoading={setLoading}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

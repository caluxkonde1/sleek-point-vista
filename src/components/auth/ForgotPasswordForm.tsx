
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const ForgotPasswordForm = ({ onBackToSignIn, loading, setLoading }: ForgotPasswordFormProps) => {
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    console.log('Attempting password reset for email:', email);

    const redirectUrl = `${window.location.origin}/reset-password`;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Password reset email sent successfully');
        toast({
          title: "Reset Link Sent",
          description: "📧 Check your email for the password reset link!",
        });
        onBackToSignIn();
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Forgot Password</h3>
        <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
      </div>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          className="w-full" 
          onClick={onBackToSignIn}
          disabled={loading}
        >
          Back to Sign In
        </Button>
      </form>
    </div>
  );
};

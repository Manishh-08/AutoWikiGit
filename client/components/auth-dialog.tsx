"use client";

import * as React from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { useQueryClient } from "@tanstack/react-query";

export function AuthDialog() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAppStore();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleGithubSignIn = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: typeof window !== "undefined" ? window.location.origin : "/",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "GitHub authentication failed";
      toast.error(message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      if (tab === "signin") {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          toast.error(error.message || "Sign in failed");
          setLoading(false);
          return;
        }
        toast.success("Signed in successfully!");
      } else {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (error) {
          toast.error(error.message || "Sign up failed");
          setLoading(false);
          return;
        }
        toast.success("Account created successfully!");
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["user-repos"] });
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-[425px] border-border/80 bg-background/95 backdrop-blur-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              AutoWikiGit Account
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Sign in with GitHub to link your repositories and enable AI code indexing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-border/80 hover:bg-muted/80 h-10 font-medium"
            onClick={handleGithubSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GithubIcon className="h-4 w-4" />
            )}
            Continue with GitHub
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
              or with email
            </span>
            <div className="border-t border-border w-full" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleEmailAuth} className="space-y-3 pt-3">
              {tab === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name" className="text-xs">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="auth-name"
                      placeholder="Linus Torvalds"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9 mt-2 font-medium"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tab === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

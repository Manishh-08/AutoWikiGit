"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GithubIcon } from "@/components/icons";
import { GitBranch, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGithub = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: typeof window !== "undefined" ? window.location.origin : "/",
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "GitHub authentication failed");
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
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to AutoWikiGit
      </Link>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <GitBranch className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">AutoWikiGit</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access your GitHub repositories and RAG vector store
          </p>
        </div>

        <Card className="border-border/80 shadow-md bg-card">
          <CardContent className="pt-6 space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-border/80 h-10 font-medium"
              onClick={handleGithub}
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
              <span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                or with email
              </span>
              <div className="border-t border-border w-full" />
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-xs">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handleEmailAuth} className="space-y-3 pt-3">
                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="login-name" className="text-xs">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-name"
                        placeholder="Ada Lovelace"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 h-9 text-xs"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 mt-2 text-xs font-medium" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {tab === "signin" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

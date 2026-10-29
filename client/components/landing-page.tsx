"use client";

import * as React from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GithubIcon } from "@/components/icons";
import {
  GitBranch,
  Sparkles,
  Search,
  FileCode2,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Loader2,
  Key,
  Code2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { setIsAuthModalOpen, setUserGithubToken } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const handleGithubSignIn = async () => {
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

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid GitHub token");
      return;
    }
    setUserGithubToken(trimmed);
    toast.success("GitHub Token saved! Welcome to AutoWikiGit.");
    setTokenDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-tight">
                AutoWikiGit
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                AI Wiki
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              className="h-9 px-3 text-xs font-medium"
            >
              Email Sign In
            </Button>

            <Button
              size="sm"
              onClick={handleGithubSignIn}
              disabled={loading}
              className="h-9 gap-2 px-4 text-xs font-medium shadow-xs"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GithubIcon className="h-3.5 w-3.5" />
              )}
              <span>Continue with GitHub</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered GitHub Repository Documentation</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight text-foreground leading-[1.15]">
              Turn any GitHub repository into an interactive{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                knowledge wiki
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AutoWikiGit connects with your GitHub account, analyzes your code structure, and lets you ask
              complex questions about functions, architecture, and workflows with citations to exact source files.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                size="lg"
                onClick={handleGithubSignIn}
                disabled={loading}
                className="w-full sm:w-auto h-11 px-6 text-sm font-semibold gap-2 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GithubIcon className="h-4 w-4" />
                )}
                <span>Sign in with GitHub to access repos</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setTokenDialogOpen(true)}
                className="w-full sm:w-auto h-11 px-5 text-sm font-medium gap-2 border-border/80"
              >
                <Key className="h-4 w-4 text-muted-foreground" />
                <span>Connect via Personal Access Token</span>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Read-only repository access
              </span>
              <span className="flex items-center gap-1.5">
                <FileCode2 className="h-4 w-4 text-primary" />
                Exact file citations
              </span>
            </div>
          </div>

          {/* Interactive Mock Preview */}
          <div className="max-w-4xl mx-auto mt-12 sm:mt-16 rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden">
            {/* Mock Window Header */}
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-2">
                  autowikigit // expressjs/express
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono h-4 gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Indexed
              </Badge>
            </div>

            {/* Mock Chat Content */}
            <div className="p-4 sm:p-6 space-y-4 text-left">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-xs sm:text-sm shadow-xs">
                  How does the router dispatch middleware and handle next() errors?
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-border/70 bg-muted/30 p-4 text-xs sm:text-sm space-y-2.5 text-foreground">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Bot className="h-4 w-4 text-primary" />
                    <span>AutoWikiGit AI</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    The router maintains an internal layer stack. When a request matches a route, it executes
                    the middleware stack iteratively. If a middleware invokes <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">next(err)</code> with an error argument, the router skips remaining standard middleware and seeks an error-handling layer with 4 parameters:
                  </p>

                  <div className="rounded-xl bg-background border border-border/80 p-3 font-mono text-xs overflow-x-auto text-foreground">
                    <span className="text-muted-foreground">{"// (err, req, res, next) error handler layer"}</span>
                    <br />
                    app.use((err, req, res, next) =&gt; &#123;
                    <br />
                    &nbsp;&nbsp;res.status(500).json(&#123; error: err.message &#125;);
                    <br />
                    &#125;);
                  </div>

                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Sources:
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px] gap-1">
                      <FileCode2 className="h-3 w-3 text-primary" />
                      lib/router/index.js
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[10px] gap-1">
                      <FileCode2 className="h-3 w-3 text-primary" />
                      lib/router/layer.js
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="border-t border-border/60 bg-muted/20 py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
                Built for Developers & Engineering Teams
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Everything you need to onboard onto new codebases, review architectures, and answer logic questions in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/70 bg-card/60 shadow-xs">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">
                    One-Click GitHub Repos
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sign in with your GitHub account to instantly list your public and private repositories, or index any public repo URL.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 shadow-xs">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileCode2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">
                    Verifiable File Citations
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every answer provides interactive pills pointing to the exact source files and line ranges used in the response.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 shadow-xs">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">
                    Architecture & Flow Q&A
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ask how authentication works, trace where routes are defined, or understand complex data flow patterns.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">AutoWikiGit</span>
            <span>— AI Repository Knowledge Base</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-border/80 bg-background/95 backdrop-blur-md">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Key className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Connect with GitHub Token
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Paste your GitHub Personal Access Token (classic or fine-grained with <code className="font-mono">repo</code> scope) to access your repositories directly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveToken} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Input
                type="password"
                placeholder="github_pat_... or ghp_..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTokenDialogOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs h-8 font-medium">
                Save Token & Continue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

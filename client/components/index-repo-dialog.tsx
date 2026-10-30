"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { fetchUserRepos, indexRepository, type RepoInfo } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search,
  Lock,
  Star,
  Sparkles,
  Loader2,
  Database,
  FileCode2,
  Key,
  CheckCircle2,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

export function IndexRepoDialog() {
  const {
    isIndexDialogOpen,
    setIsIndexDialogOpen,
    userGithubToken,
    setUserGithubToken,
    indexedRepos,
    addIndexedRepo,
    updateRepoStatus,
    setSelectedRepo,
    setIsAuthModalOpen,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"manual" | "github">("manual");
  const [manualInput, setManualInput] = useState("");
  const [tokenInput, setTokenInput] = useState(userGithubToken || "");
  const [repoSearch, setRepoSearch] = useState("");
  const [showTokenField, setShowTokenField] = useState(!userGithubToken);

  const sessionQuery = authClient.useSession();
  const isAuthenticated = !!sessionQuery?.data?.user;
  const hasToken = !!userGithubToken || isAuthenticated;

  // TanStack Query for user GitHub repositories
  const {
    data: userRepos,
    isLoading: isLoadingRepos,
    isError: isReposError,
    error: reposError,
    refetch: refetchRepos,
  } = useQuery({
    queryKey: ["user-repos", userGithubToken, isAuthenticated],
    queryFn: () => fetchUserRepos(userGithubToken || undefined),
    enabled: isIndexDialogOpen && hasToken,
    retry: 1,
  });

  // TanStack Mutation for indexing
  const indexMutation = useMutation({
    mutationFn: ({ repo, token }: { repo: string; token?: string }) =>
      indexRepository({ repo, token: token || userGithubToken || undefined }),
    onSuccess: (data, variables) => {
      const clean = variables.repo
        .replace("https://github.com/", "")
        .replace("http://github.com/", "")
        .replace(/\.git$/, "");
      const [owner, name] = clean.split("/");

      const repoKey = `${owner}/${name || owner}`;

      addIndexedRepo({
        repoKey,
        name: name || owner,
        owner: owner || "user",
        status: "ready",
      });

      setSelectedRepo(repoKey);
      updateRepoStatus(repoKey, "ready");
      toast.success(`${clean} is ready!`, {
        description: "Repository is indexed. You can start chatting now.",
      });

      setIsIndexDialogOpen(false);
      setManualInput("");
    },
    onError: (err: Error) => {
      const msg = err.message || "Failed to start repository indexing";
      if (
        msg.includes("linked GitHub account") ||
        msg.includes("403") ||
        msg.includes("401") ||
        msg.includes("Unauthorized") ||
        msg.includes("token")
      ) {
        toast.error("GitHub Authentication Required", {
          description: msg,
          action: {
            label: "Sign in with GitHub",
            onClick: () => {
              setIsIndexDialogOpen(false);
              setIsAuthModalOpen(true);
            },
          },
        });
      } else {
        toast.error(msg);
      }
    },
  });

  const handleSaveToken = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setUserGithubToken(null);
      toast.info("Cleared custom GitHub token");
    } else {
      setUserGithubToken(trimmed);
      toast.success("GitHub Token saved!");
      refetchRepos();
    }
  };

  const handleManualIndex = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) {
      toast.error("Please enter a repository name or URL");
      return;
    }

    const currentToken = tokenInput.trim() || userGithubToken || undefined;
    if (tokenInput.trim() && tokenInput.trim() !== userGithubToken) {
      setUserGithubToken(tokenInput.trim());
    }

    if (!currentToken && !isAuthenticated) {
      toast.error("GitHub Authentication Required", {
        description: "Please paste your GitHub Personal Access Token below or sign in with GitHub.",
        action: {
          label: "Sign In",
          onClick: () => {
            setIsIndexDialogOpen(false);
            setIsAuthModalOpen(true);
          },
        },
      });
      setShowTokenField(true);
      return;
    }

    indexMutation.mutate({ repo: trimmed, token: currentToken });
  };

  const handleSelectGithubRepo = (repo: RepoInfo) => {
    indexMutation.mutate({
      repo: repo.fullName,
      token: userGithubToken || undefined,
    });
  };

  const filteredRepos = (userRepos || []).filter((r) =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  return (
    <Dialog open={isIndexDialogOpen} onOpenChange={setIsIndexDialogOpen}>
      <DialogContent className="sm:max-w-[580px] border-border/80 bg-background/95 backdrop-blur-md p-6">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Index GitHub Repository
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Index your repository to enable AI search and code answers
                </DialogDescription>
              </div>
            </div>

            {/* Auth / Token indicator badge */}
            {hasToken ? (
              <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/40 text-emerald-500 h-5">
                <CheckCircle2 className="h-3 w-3" />
                {isAuthenticated ? "GitHub OAuth" : "Token Saved"}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={() => {
                  setIsIndexDialogOpen(false);
                  setIsAuthModalOpen(true);
                }}
              >
                <GithubIcon className="h-3 w-3" />
                Sign In
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* User Token Drawer / Input */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>User GitHub Token (PAT)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTokenField(!showTokenField)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              {showTokenField ? "Hide" : userGithubToken ? "Edit Token" : "Enter Token"}
            </button>
          </div>

          {showTokenField && (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="github_pat_... or ghp_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="h-8 text-xs font-mono bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs px-3 shrink-0"
                  onClick={handleSaveToken}
                >
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Enter your Personal Access Token (classic or fine-grained with <code className="font-mono">repo</code> scope) or sign in via GitHub OAuth.
              </p>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "github" | "manual")}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="text-xs gap-1.5">
              <FileCode2 className="h-3.5 w-3.5" />
              Repository URL / Key
            </TabsTrigger>
            <TabsTrigger value="github" className="text-xs gap-1.5">
              <GithubIcon className="h-3.5 w-3.5" />
              My GitHub Repos
            </TabsTrigger>
          </TabsList>

          {/* Manual / Public URL Tab */}
          <TabsContent value="manual" className="space-y-3 pt-2">
            <form onSubmit={handleManualIndex} className="space-y-3">
              <div className="space-y-1.5">
                <Input
                  placeholder="e.g. facebook/react or https://github.com/expressjs/express"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="h-9 text-xs font-mono"
                  disabled={indexMutation.isPending}
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter <code className="font-mono">owner/repo</code> or full GitHub repository URL.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-9 text-xs font-medium gap-1.5 mt-2"
                disabled={indexMutation.isPending || !manualInput.trim()}
              >
                {indexMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Indexing repository...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Start Indexing Repository
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Connected GitHub Repos Tab */}
          <TabsContent value="github" className="space-y-3 pt-2">
            {!hasToken ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                <GithubIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">GitHub Account or Token Required</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Sign in with GitHub or enter your GitHub Personal Access Token above to load your repositories.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsIndexDialogOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="gap-2 text-xs"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  Sign In with GitHub
                </Button>
              </div>
            ) : isLoadingRepos ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-mono">Fetching your repositories from GitHub...</span>
              </div>
            ) : isReposError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center space-y-2">
                <p className="text-xs text-destructive font-medium">
                  {(reposError as Error)?.message || "Failed to load GitHub repositories"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Check your GitHub token or reconnect with GitHub OAuth.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search your repositories..."
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <ScrollArea className="h-[200px] rounded-lg border border-border/70 p-2">
                  {filteredRepos.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No repositories found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredRepos.map((repo) => {
                        const indexedItem = indexedRepos.find(
                          (ir) => ir.repoKey.toLowerCase() === repo.fullName.toLowerCase()
                        );
                        const isReady = indexedItem?.status === "ready";
                        const isIndexing = indexedItem?.status === "indexing";

                        return (
                          <div
                            key={repo.id}
                            className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/60 border border-transparent hover:border-border/50 group"
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {repo.fullName}
                                </span>
                                {isReady && (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] h-4 px-1.5 gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Ready
                                  </Badge>
                                )}
                                {isIndexing && (
                                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] h-4 px-1.5 gap-1">
                                    <Loader2 className="h-2 w-2 animate-spin" />
                                    Indexing
                                  </Badge>
                                )}
                                {repo.isPrivate && (
                                  <Badge variant="secondary" className="text-[9px] h-3.5 px-1 gap-0.5">
                                    <Lock className="h-2.5 w-2.5" />
                                    Private
                                  </Badge>
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                {repo.language && (
                                  <span className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {repo.language}
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <Star className="h-2.5 w-2.5" />
                                  {repo.stars}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={isReady ? "default" : "secondary"}
                              className={`h-7 text-xs font-medium shrink-0 transition-all ${
                                isReady
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "group-hover:bg-primary group-hover:text-primary-foreground"
                              }`}
                              onClick={() => {
                                if (isReady) {
                                  setSelectedRepo(repo.fullName);
                                  setIsIndexDialogOpen(false);
                                } else {
                                  handleSelectGithubRepo(repo);
                                }
                              }}
                              disabled={indexMutation.isPending}
                            >
                              {indexMutation.isPending &&
                              indexMutation.variables?.repo === repo.fullName ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isReady ? (
                                "Chat"
                              ) : (
                                "Index"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

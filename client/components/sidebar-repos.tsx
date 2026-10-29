"use client";

import * as React from "react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  FolderGit2,
  MoreVertical,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { indexRepository } from "@/lib/api";

export function SidebarRepos() {
  const {
    indexedRepos,
    selectedRepo,
    setSelectedRepo,
    removeIndexedRepo,
    updateRepoStatus,
    setIsIndexDialogOpen,
  } = useAppStore();

  const [search, setSearch] = useState("");

  const reindexMutation = useMutation({
    mutationFn: (repoKey: string) => indexRepository(repoKey),
    onSuccess: (_, repoKey) => {
      updateRepoStatus(repoKey, "ready");
      toast.success(`Re-indexing requested for ${repoKey}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to re-index");
    },
  });

  const filteredRepos = indexedRepos.filter(
    (r) =>
      r.repoKey.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (repoKey: string) => {
    setSelectedRepo(repoKey);
  };

  const handleRemove = (e: React.MouseEvent, repoKey: string) => {
    e.stopPropagation();
    removeIndexedRepo(repoKey);
    toast.info(`Removed ${repoKey} from list`);
  };

  const handleReindex = (e: React.MouseEvent, repoKey: string) => {
    e.stopPropagation();
    updateRepoStatus(repoKey, "indexing");
    reindexMutation.mutate(repoKey);
  };

  return (
    <aside className="w-80 shrink-0 border-r border-border/70 bg-card/40 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Top Search & Actions */}
      <div className="p-3.5 space-y-2.5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FolderGit2 className="h-3.5 w-3.5 text-primary" />
            Knowledge Base
          </span>
          <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5">
            {indexedRepos.length} Repos
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search indexed repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/60"
          />
        </div>

        <Button
          onClick={() => setIsIndexDialogOpen(true)}
          className="w-full h-8 text-xs font-medium gap-1.5 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Index Repository
        </Button>
      </div>

      {/* Repositories List */}
      <ScrollArea className="flex-1 px-2 py-2">
        {filteredRepos.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <FolderGit2 className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
            <p className="text-xs font-medium text-foreground">No repositories found</p>
            <p className="text-[11px] text-muted-foreground">
              {search ? "No matches for your search" : "Click 'Index Repository' above to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepo === repo.repoKey;
              return (
                <div
                  key={repo.repoKey}
                  onClick={() => handleSelect(repo.repoKey)}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-foreground font-medium shadow-xs"
                      : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    {/* Status Dot */}
                    {repo.status === "indexing" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
                    ) : repo.status === "error" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] shrink-0" />
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-foreground">
                        {repo.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate font-mono">
                        {repo.owner}
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 text-xs">
                      <DropdownMenuItem
                        onClick={(e) => handleReindex(e, repo.repoKey)}
                        className="text-xs gap-2 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-index Repo
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-xs gap-2 cursor-pointer">
                        <a
                          href={`https://github.com/${repo.repoKey}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View on GitHub
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleRemove(e, repo.repoKey)}
                        className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove from list
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

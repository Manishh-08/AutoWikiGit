"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Moon,
  Sun,
  ExternalLink,
  LogOut,
  FolderGit2,
  Menu,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { toast } from "sonner";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const {
    selectedRepo,
    setIsAuthModalOpen,
    setUserGithubToken,
    setIsMobileSidebarOpen,
  } = useAppStore();

  const sessionQuery = authClient.useSession();
  const user = sessionQuery?.data?.user;

  const handleSignOut = async () => {
    try {
      setUserGithubToken(null);
      await authClient.signOut();
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["user-repos"] });
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        {/* Left: Mobile Menu Toggle + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Toggle Repositories"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading font-bold text-sm sm:text-base tracking-tight truncate">
                AutoWikiGit
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                Wiki
              </Badge>
            </div>
          </div>
        </div>

        {/* Selected Repo Bar in Center */}
        <div className="hidden md:flex items-center gap-2 max-w-md truncate">
          {selectedRepo ? (
            <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs">
              <FolderGit2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{selectedRepo}</span>
              <a
                href={`https://github.com/${selectedRepo}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                title="View on GitHub"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span>No repository selected</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Auth Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 ring-1 ring-border"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user.name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GithubIcon className="h-3.5 w-3.5" />
                    GitHub Account
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    Connected
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              className="h-8 gap-1.5 px-3 text-xs font-medium"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

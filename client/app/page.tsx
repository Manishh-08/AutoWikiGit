"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { SidebarRepos } from "@/components/sidebar-repos";
import { ChatArea } from "@/components/chat-area";
import { IndexRepoDialog } from "@/components/index-repo-dialog";
import { AuthDialog } from "@/components/auth-dialog";
import { CitationViewer } from "@/components/citation-viewer";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const sessionQuery = authClient.useSession();
  const user = sessionQuery?.data?.user;
  const isPending = sessionQuery?.isPending;
  const { userGithubToken } = useAppStore();

  const isAuthenticated = !!user || !!userGithubToken;

  if (isPending && !userGithubToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground font-medium">Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage />
        <AuthDialog />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Two-Pane Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar for Repositories */}
        <SidebarRepos />

        {/* Center Wiki & Chat Interface */}
        <ChatArea />
      </div>

      {/* Dialogs and Overlays */}
      <IndexRepoDialog />
      <AuthDialog />
      <CitationViewer />
    </div>
  );
}

"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMutation } from "@tanstack/react-query";
import { useAppStore, type ChatMessage } from "@/lib/store";
import { sendChatMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
} from "@/components/ui/code-block";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Bot,
  Trash2,
  ExternalLink,
  Loader2,
  FileCode2,
  FolderGit2,
  Code2,
  Plus,
} from "lucide-react";

function generateMessageId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatArea() {
  const {
    selectedRepo,
    indexedRepos,
    chatHistories,
    addMessage,
    clearChat,
    setActiveCitation,
    setIsIndexDialogOpen,
    setIsAuthModalOpen,
  } = useAppStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionQuery = authClient.useSession();
  const user = sessionQuery?.data?.user;

  const currentRepo = indexedRepos.find((r) => r.repoKey === selectedRepo);
  const messages: ChatMessage[] = useMemo(() => {
    return selectedRepo ? chatHistories[selectedRepo] || [] : [];
  }, [selectedRepo, chatHistories]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRepo, scrollToBottom]);

  // TanStack Query Mutation for sending message
  const chatMutation = useMutation({
    mutationFn: (question: string) => {
      if (!selectedRepo) throw new Error("No repository selected");
      return sendChatMessage({
        repo: selectedRepo,
        question,
      });
    },
    onSuccess: (data) => {
      if (!selectedRepo) return;

      if (data.status === "completed" && data.answer) {
        addMessage(selectedRepo, {
          id: generateMessageId("assistant"),
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          timestamp: getTimestamp(),
          status: "sent",
        });
      } else {
        addMessage(selectedRepo, {
          id: generateMessageId("assistant"),
          role: "assistant",
          content: "Your question has been received and is being processed.",
          sources: [],
          timestamp: getTimestamp(),
          status: "sent",
        });
      }
    },
    onError: (err: Error) => {
      if (!selectedRepo) return;
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        toast.error("Please sign in with GitHub or provide a token", {
          action: {
            label: "Sign In",
            onClick: () => setIsAuthModalOpen(true),
          },
        });
      } else {
        toast.error(err.message || "Failed to generate answer");
      }

      addMessage(selectedRepo, {
        id: generateMessageId("assistant-err"),
        role: "assistant",
        content: `Error: ${err.message || "Unable to reach service"}. Please make sure the repo has been indexed.`,
        timestamp: getTimestamp(),
        status: "error",
      });
    },
  });

  const handleSend = useCallback((textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || !selectedRepo || chatMutation.isPending) return;

    addMessage(selectedRepo, {
      id: generateMessageId("user"),
      role: "user",
      content: query,
      timestamp: getTimestamp(),
      status: "sent",
    });

    setInput("");
    chatMutation.mutate(query);
  }, [input, selectedRepo, chatMutation, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Explain the primary architecture and high-level workflow of this project.",
    "Where are the API routes defined and what endpoints exist?",
    "How does authentication and session management work?",
    "What external libraries, services, or databases are integrated?",
  ];

  // If no repository is selected
  if (!selectedRepo) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-background/50">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-md">
            <FolderGit2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground">
              Select or Index a Repository
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AutoWikiGit builds an AI documentation assistant for any GitHub repository. Ask questions,
              explore code, and view file citations instantly.
            </p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <Button
              onClick={() => setIsIndexDialogOpen(true)}
              className="gap-2 h-9 text-xs font-medium"
            >
              <Plus className="h-4 w-4" />
              Index Repository
            </Button>
          </div>

          {/* Quick tips */}
          <div className="border border-border/60 rounded-xl p-4 bg-card/60 text-left space-y-2 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Getting Started
            </span>
            <ul className="text-muted-foreground space-y-1 list-disc pl-4 text-[11px]">
              <li>Index any repository to begin querying its architecture and code.</li>
              <li>Ask natural language questions to understand functions, routes, and workflows.</li>
              <li>View exact file citations referenced by the assistant for each answer.</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-background overflow-hidden">
      {/* Top Header of Chat Area */}
      <div className="h-14 border-b border-border/70 px-4 sm:px-6 flex items-center justify-between bg-card/20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <FolderGit2 className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {selectedRepo}
              </span>
              <a
                href={`https://github.com/${selectedRepo}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="View on GitHub"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ready for questions</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearChat(selectedRepo);
                toast.info("Chat history cleared");
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 py-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <Bot className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground">
                Ask anything about {currentRepo?.name || selectedRepo}
              </h3>
              <p className="text-xs text-muted-foreground">
                Ask questions about code, API endpoints, logic flow, and dependencies.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block text-left">
                Suggested questions:
              </span>
              <div className="grid grid-cols-1 gap-2 text-left">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 p-3 text-xs text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
                  >
                    <span className="truncate pr-2">{prompt}</span>
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <Message
                key={message.id}
                align={isUser ? "end" : "start"}
                className="max-w-3xl mx-auto"
              >
                <MessageContent>
                  <MessageHeader className="gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {isUser ? user?.name || "You" : "AutoWikiGit AI"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {message.timestamp}
                    </span>
                  </MessageHeader>

                  {isUser ? (
                    <div className="flex justify-end w-full">
                      <div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-sm shadow-xs leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start w-full">
                      <div className="max-w-[85%] rounded-2xl border border-border/70 bg-card text-foreground p-4 space-y-3 shadow-xs break-words">
                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-sm space-y-3">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const isMultiline = String(children).includes("\n");

                                if (isMultiline) {
                                  return (
                                    <CodeBlock className="my-3 font-mono">
                                      <CodeBlockHeader>
                                        <CodeBlockTitle>
                                          <Code2 className="h-3.5 w-3.5" />
                                          {match ? match[1] : "code"}
                                        </CodeBlockTitle>
                                        <CodeBlockActions>
                                          <CodeBlockCopyButton value={String(children).replace(/\n$/, "")} />
                                        </CodeBlockActions>
                                      </CodeBlockHeader>
                                      <CodeBlockContent>
                                        {String(children).replace(/\n$/, "")}
                                      </CodeBlockContent>
                                    </CodeBlock>
                                  );
                                }

                                return (
                                  <code
                                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-foreground"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              p({ children }) {
                                return <p className="mb-2 last:mb-0">{children}</p>;
                              },
                              ul({ children }) {
                                return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                              },
                              ol({ children }) {
                                return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Source Citations */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="pt-2 border-t border-border/60 space-y-1.5 not-prose">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              <FileCode2 className="h-3 w-3 text-primary" />
                              Sources ({message.sources.length}):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map((source) => (
                                <button
                                  key={source}
                                  type="button"
                                  onClick={() =>
                                    setActiveCitation({
                                      path: source,
                                      repo: selectedRepo,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
                                  title={`Click to inspect ${source}`}
                                >
                                  <span className="truncate max-w-[240px]">{source}</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </MessageContent>
              </Message>
            );
          })
        )}

        {/* Thinking Indicator while mutation is pending */}
        {chatMutation.isPending && (
          <Message align="start" className="max-w-3xl mx-auto">
            <MessageContent>
              <MessageHeader className="gap-2">
                <span className="font-semibold text-xs text-foreground">AutoWikiGit AI</span>
                <span className="text-[10px] text-muted-foreground font-mono">Thinking...</span>
              </MessageHeader>
              <div className="flex justify-start w-full">
                <div className="rounded-2xl border border-border/70 bg-card text-foreground p-4 flex items-center gap-3 shadow-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    Analyzing repository and generating answer...
                  </span>
                </div>
              </div>
            </MessageContent>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-border/70 bg-card/30 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="relative rounded-2xl border border-border/80 bg-background shadow-xs focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              ref={textareaRef}
              placeholder={`Ask about ${currentRepo?.name || selectedRepo} code, functions, routes, or architecture...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none border-0 shadow-none focus-visible:ring-0 text-xs sm:text-sm p-3 pr-12 min-h-[56px] max-h-36 font-sans bg-transparent"
              disabled={chatMutation.isPending}
            />

            <Button
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              onClick={() => handleSend()}
              className="absolute right-2.5 bottom-2.5 h-8 w-8 rounded-xl shrink-0"
              title="Send (Enter)"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>
              Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to send, <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">Shift+Enter</kbd> for newline
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

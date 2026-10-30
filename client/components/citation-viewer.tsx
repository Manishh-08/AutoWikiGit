"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileCode, ExternalLink, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function CitationViewer() {
  const { activeCitation, setActiveCitation } = useAppStore();
  const [copied, setCopied] = React.useState(false);

  if (!activeCitation) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(activeCitation.path);
    setCopied(true);
    toast.success("File path copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const githubUrl = `https://github.com/${activeCitation.repo}/blob/main/${activeCitation.path}`;

  return (
    <Dialog
      open={!!activeCitation}
      onOpenChange={(open) => !open && setActiveCitation(null)}
    >
      <DialogContent className="w-[95vw] max-w-[480px] max-h-[90vh] overflow-y-auto border-border/80 bg-background/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight font-mono truncate max-w-sm">
                {activeCitation.path.split("/").pop()}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground truncate">
                {activeCitation.repo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Exact File Path
            </span>
            <div className="flex items-center justify-between gap-2 bg-background/80 rounded-lg p-2 border border-border/60">
              <code className="text-xs font-mono text-foreground break-all">
                {activeCitation.path}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopyPath}
                title="Copy Path"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-primary text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Referenced Source File
            </div>
            <p className="text-[11px] leading-relaxed">
              This code file was analyzed from the repository to generate your answer.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveCitation(null)}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              size="sm"
              asChild
              className="text-xs h-8 gap-1.5"
            >
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: string;
  status?: "sending" | "processing" | "sent" | "error";
  error?: string;
}

export interface IndexedRepoItem {
  repoKey: string;
  name: string;
  owner: string;
  isPrivate?: boolean;
  status: "indexing" | "ready" | "error";
  indexedAt: string;
  fileCount?: number;
  chunkCount?: number;
}

interface AppState {
  selectedRepo: string | null;
  userGithubToken: string | null;
  indexedRepos: IndexedRepoItem[];
  chatHistories: Record<string, ChatMessage[]>;
  activeCitation: { path: string; repo: string } | null;
  isIndexDialogOpen: boolean;
  isAuthModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  chatMode: "sync" | "async";
  searchQuery: string;

  setSelectedRepo: (repo: string | null) => void;
  setUserGithubToken: (token: string | null) => void;
  addIndexedRepo: (repo: Omit<IndexedRepoItem, "indexedAt"> & { indexedAt?: string }) => void;
  updateRepoStatus: (repoKey: string, status: "indexing" | "ready" | "error", extra?: { fileCount?: number; chunkCount?: number }) => void;
  removeIndexedRepo: (repoKey: string) => void;
  addMessage: (repoKey: string, message: ChatMessage) => void;
  updateMessage: (repoKey: string, id: string, patch: Partial<ChatMessage>) => void;
  clearChat: (repoKey: string) => void;
  setActiveCitation: (citation: { path: string; repo: string } | null) => void;
  setIsIndexDialogOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setChatMode: (mode: "sync" | "async") => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedRepo: null,
      userGithubToken: null,
      indexedRepos: [],
      chatHistories: {},
      activeCitation: null,
      isIndexDialogOpen: false,
      isAuthModalOpen: false,
      isMobileSidebarOpen: false,
      chatMode: "sync",
      searchQuery: "",

      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      setUserGithubToken: (token) => set({ userGithubToken: token }),

      addIndexedRepo: (repo) =>
        set((state) => {
          const exists = state.indexedRepos.find((r) => r.repoKey === repo.repoKey);
          if (exists) {
            return {
              selectedRepo: repo.repoKey,
              indexedRepos: state.indexedRepos.map((r) =>
                r.repoKey === repo.repoKey
                  ? {
                      ...r,
                      ...repo,
                      status: repo.status || "ready",
                      indexedAt: repo.indexedAt || new Date().toISOString(),
                    }
                  : r
              ),
            };
          }
          return {
            selectedRepo: repo.repoKey,
            indexedRepos: [
              {
                ...repo,
                indexedAt: repo.indexedAt || new Date().toISOString(),
                status: repo.status || "ready",
              },
              ...state.indexedRepos,
            ],
          };
        }),

      updateRepoStatus: (repoKey, status, extra) =>
        set((state) => ({
          indexedRepos: state.indexedRepos.map((r) =>
            r.repoKey === repoKey ? { ...r, status, ...extra } : r
          ),
        })),

      removeIndexedRepo: (repoKey) =>
        set((state) => ({
          indexedRepos: state.indexedRepos.filter((r) => r.repoKey !== repoKey),
          selectedRepo: state.selectedRepo === repoKey ? null : state.selectedRepo,
        })),

      addMessage: (repoKey, message) =>
        set((state) => {
          const history = state.chatHistories[repoKey] || [];
          return {
            chatHistories: {
              ...state.chatHistories,
              [repoKey]: [...history, message],
            },
          };
        }),

      updateMessage: (repoKey, id, patch) =>
        set((state) => {
          const history = state.chatHistories[repoKey] || [];
          return {
            chatHistories: {
              ...state.chatHistories,
              [repoKey]: history.map((m) => (m.id === id ? { ...m, ...patch } : m)),
            },
          };
        }),

      clearChat: (repoKey) =>
        set((state) => {
          const newHistories = { ...state.chatHistories };
          delete newHistories[repoKey];
          return { chatHistories: newHistories };
        }),

      setActiveCitation: (citation) => set({ activeCitation: citation }),
      setIsIndexDialogOpen: (open) => set({ isIndexDialogOpen: open }),
      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      setIsMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
      setChatMode: (mode) => set({ chatMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: "autowikigit-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedRepo: state.selectedRepo,
        userGithubToken: state.userGithubToken,
        indexedRepos: state.indexedRepos,
        chatHistories: state.chatHistories,
        chatMode: state.chatMode,
      }),
    }
  )
);

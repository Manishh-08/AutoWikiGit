import { useAppStore } from "./store";

export const SERVER_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  stars: number;
  language: string | null;
  updatedAt: string;
  htmlUrl: string;
  defaultBranch: string;
}

export interface ChatResponse {
  repo: string;
  question: string;
  status: "completed" | "queued" | "error";
  answer?: string;
  sources?: string[];
  message?: string;
  error?: string;
}

export interface IndexResponse {
  message: string;
  repo: string;
  fileCount?: number;
  chunkCount?: number;
  saved?: boolean;
}

export interface RepoStatusResponse {
  repo: string;
  status: "ready" | "indexing" | "error";
  recordCount?: number;
}

function getStoredToken(): string | null {
  try {
    return useAppStore.getState().userGithubToken;
  } catch {
    return null;
  }
}

async function extractErrorMessage(res: Response, defaultMessage: string): Promise<string> {
  let message = "";
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      message = json.error || json.message;
    } else {
      const text = await res.text();
      const preMatch = /<pre>([\s\S]*?)<\/pre>/.exec(text);
      if (preMatch) {
        message = preMatch[1].trim();
      } else if (text && text.length < 200) {
        message = text.trim();
      }
    }
  } catch {
    // ignore parse error
  }

  if (!message) {
    if (res.status === 401) {
      message = "Unauthorized: Please sign in with GitHub or provide a GitHub token";
    } else if (res.status === 403) {
      message = "Forbidden: A linked GitHub account or personal access token is required";
    } else if (res.status === 404) {
      message = "Endpoint not found on backend server";
    } else {
      message = `${defaultMessage} (${res.status})`;
    }
  }

  return message;
}

export async function checkServerHealth(): Promise<string> {
  const res = await fetch(`${SERVER_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.text();
}

export async function fetchUserRepos(tokenOverride?: string): Promise<RepoInfo[]> {
  const token = tokenOverride || getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["x-github-token"] = token;
  }

  const res = await fetch(`${SERVER_URL}/api/index/repos`, {
    method: "GET",
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to fetch repositories");
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function indexRepository(params: { repo: string; token?: string } | string): Promise<IndexResponse> {
  const repo = typeof params === "string" ? params : params.repo;
  const token = (typeof params === "object" ? params.token : undefined) || getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["x-github-token"] = token;
  }

  const res = await fetch(`${SERVER_URL}/api/index`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ repo, token: token || undefined }),
  });

  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to index repository");
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (typeof data === "string") {
    return { message: data, repo };
  }
  return data;
}

export async function fetchRepoStatus(repo: string): Promise<RepoStatusResponse> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["x-github-token"] = token;
  }

  const res = await fetch(`${SERVER_URL}/api/index/status?repo=${encodeURIComponent(repo)}`, {
    method: "GET",
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    return { repo, status: "ready" };
  }

  return res.json();
}

export async function sendChatMessage(params: {
  repo: string;
  question: string;
  async?: boolean;
  token?: string;
}): Promise<ChatResponse> {
  const token = params.token || getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["x-github-token"] = token;
  }

  const res = await fetch(`${SERVER_URL}/api/chat`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      repo: params.repo,
      question: params.question,
      async: params.async ?? false,
    }),
  });

  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to query repository");
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (typeof data === "string") {
    return {
      repo: params.repo,
      question: params.question,
      status: "queued",
      message: data,
    };
  }
  return data;
}

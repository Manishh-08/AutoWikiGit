import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { Octokit } from "@octokit/rest";
import { inngest } from "../inngest/client.js";
import { auth } from "../auth/auth.js";
import { parseRepo } from "../services/github.js";
import { getRepoStatus } from "../services/vectorStore.js";

const router = Router();

// GET /api/index/repos - List user repositories from connected GitHub account or provided token
router.get("/repos", async (req, res) => {
  const customToken = req.headers["x-github-token"] || req.query.token;

  let githubToken = customToken;

  if (!githubToken && res.locals.user?.id && res.locals.user.id !== "pat-user") {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const githubAccount = accounts?.find((account) => account.providerId === "github");

    if (githubAccount) {
      const tokenRes = await auth.api.getAccessToken({
        body: {
          userId: res.locals.user.id,
          accountId: githubAccount.id,
        },
      });
      githubToken = tokenRes?.accessToken || githubAccount.accessToken;
    }
  }

  if (!githubToken) {
    return res.status(403).json({
      error: "A linked GitHub account or GitHub personal access token is required to list repositories",
    });
  }

  const octokit = new Octokit({ auth: githubToken });
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    visibility: "all",
  });

  const formattedRepos = repos.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    owner: r.owner.login,
    description: r.description,
    isPrivate: r.private,
    stars: r.stargazers_count,
    language: r.language,
    updatedAt: r.updated_at,
    htmlUrl: r.html_url,
    defaultBranch: r.default_branch,
  }));

  res.json(formattedRepos);
});

// POST /api/index - Index a repository with Inngest
router.post("/", async (req, res) => {
  const { repo: repository, token: customToken } = req.body ?? {};

  if (!repository) {
    return res.status(400).json({ error: "repo is required" });
  }

  let githubToken = customToken || req.headers["x-github-token"];
  let githubAccountId = null;

  if (!githubToken && res.locals.user?.id && res.locals.user.id !== "pat-user") {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const githubAccount = accounts?.find((account) => account.providerId === "github");

    if (githubAccount) {
      githubAccountId = githubAccount.id;
      const tokenRes = await auth.api.getAccessToken({
        body: {
          userId: res.locals.user.id,
          accountId: githubAccount.id,
        },
      });
      githubToken = tokenRes?.accessToken || githubAccount.accessToken;
    }
  }

  const { owner, repo, repoKey } = parseRepo(repository);

  await inngest.send({
    name: "repo/index.requested",
    data: {
      userId: res.locals.user?.id || "pat-user",
      githubAccountId,
      githubToken: githubToken || null,
      owner,
      repo,
      repoKey,
    },
  });

  res.json({ message: "Repo Indexing", repo: repoKey });
});

// GET /api/index/status - Get indexing status of a repository
router.get("/status", async (req, res) => {
  const { repo } = req.query;
  if (!repo || typeof repo !== "string") {
    return res.status(400).json({ error: "repo query parameter is required" });
  }

  const { repoKey } = parseRepo(repo);
  const status = await getRepoStatus(repoKey);
  res.json(status);
});

export default router;

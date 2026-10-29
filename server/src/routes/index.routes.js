import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { Octokit } from "@octokit/rest";
import { inngest } from "../inngest/client.js";
import { auth } from "../auth/auth.js";
import { parseRepo } from "../services/github.js";

const router = Router();

// GET /api/index/repos - List user repositories from connected GitHub account
router.get("/repos", async (req, res) => {
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const githubAccount = accounts?.find((account) => account.providerId === "github");

    if (!githubAccount) {
      return res.status(403).json({
        error: "A linked GitHub account is required to list repositories",
        hasGithub: false,
      });
    }

    let githubToken;
    try {
      const tokenRes = await auth.api.getAccessToken({
        body: {
          userId: res.locals.user.id,
          accountId: githubAccount.id,
        },
      });
      githubToken = tokenRes?.accessToken;
    } catch {
      // If getAccessToken isn't available, check account.accessToken
      githubToken = githubAccount.accessToken;
    }

    if (!githubToken) {
      return res.status(400).json({ error: "Could not retrieve GitHub access token" });
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
  } catch (err) {
    console.error("Error fetching user repos:", err);
    res.status(500).json({ error: err.message || "Failed to fetch repositories" });
  }
});

// POST /api/index - Index a repository
router.post("/", async (req, res) => {
  const { repo: repository } = req.body ?? {};

  if (!repository) {
    return res.status(400).json({ error: "repo is required" });
  }

  const accounts = await auth.api.listUserAccounts({
    headers: fromNodeHeaders(req.headers),
  });
  const githubAccount = accounts?.find((account) => account.providerId === "github");

  if (!githubAccount) {
    return res.status(403).json({
      error: "A linked GitHub account is required to index repositories",
    });
  }

  const { owner, repo, repoKey } = parseRepo(repository);

  await inngest.send({
    name: "repo/index.requested",
    data: {
      userId: res.locals.user.id,
      githubAccountId: githubAccount.id,
      owner,
      repo,
      repoKey,
    },
  });

  res.json({ message: "Repo Indexing", repo: repoKey });
});

export default router;

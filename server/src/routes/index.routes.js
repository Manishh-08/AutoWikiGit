import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { inngest } from "../inngest/client.js";
import { auth } from "../auth/auth.js";
import { parseRepo } from "../services/github.js";


const router = Router();

router.post("/", async (req, res) => {
  const { repo: repository } = req.body ?? {};

  if (!repository) {
    return res.status(400).json({ error: "repo is required" });
  }

  const accounts = await auth.api.listUserAccounts({
    headers: fromNodeHeaders(req.headers),
  });
  const githubAccount = accounts.find((account) => account.providerId === "github");

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

  res.json("Repo Indexing");
});

export default router;
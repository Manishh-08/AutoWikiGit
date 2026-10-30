import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../services/github.js";

const router = Router();

async function startChatJob(repo, question) {
  const { repoKey } = parseRepo(repo);

  await inngest.send({
    name: "chat/question.requested",
    data: { repo: repoKey, question },
  });

  return "Chat questioning done -> Inngest";
}

router.post("/", async (req, res) => {
  const { repo, question } = req.body ?? {};

  if (!repo || !question) {
    return res.status(400).json({ error: "repo and question are required" });
  }

  const { repoKey } = parseRepo(repo);
  const message = await startChatJob(repo, question);

  res.status(202).json({
    message,
    repo: repoKey,
    question,
    status: "queued",
  });
});

export default router;

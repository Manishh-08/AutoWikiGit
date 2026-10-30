import { Router } from "express";
import { randomUUID } from "node:crypto";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../services/github.js";
import { createChatJob, failChatJob, getChatJob } from "../services/chatJobs.js";

const router = Router();

async function startChatJob({ id, userId, repo, question }) {
  const { repoKey } = parseRepo(repo);

  await inngest.send({
    name: "chat/question.requested",
    data: { jobId: id, userId, repo: repoKey, question },
  });

  return "Your question has been received and is being processed.";
}

router.post("/", async (req, res) => {
  const { repo, question } = req.body ?? {};

  if (!repo || !question) {
    return res.status(400).json({ error: "repo and question are required" });
  }

  const { repoKey } = parseRepo(repo);
  const id = randomUUID();
  await createChatJob({
    id,
    userId: res.locals.user.id,
    repo: repoKey,
    question,
  });
  let message;
  try {
    message = await startChatJob({
      id,
      userId: res.locals.user.id,
      repo,
      question,
    });
  } catch (error) {
    await failChatJob(id, error instanceof Error ? error.message : "Unable to queue question");
    throw error;
  }

  res.status(202).json({
    jobId: id,
    message,
    repo: repoKey,
    question,
    status: "queued",
  });
});

router.get("/jobs/:jobId", async (req, res) => {
  const job = await getChatJob(req.params.jobId, res.locals.user.id);

  if (!job) {
    return res.status(404).json({ error: "Chat job not found" });
  }

  res.json(job);
});

export default router;

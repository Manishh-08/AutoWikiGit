import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../services/github.js";
import { askQuestion } from "../services/rag.js";

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
  const { repo, question, async: isAsync } = req.body ?? {};

  if (!repo || !question) {
    return res.status(400).json({ error: "repo and question are required" });
  }

  const { repoKey } = parseRepo(repo);

  if (isAsync) {
    const message = await startChatJob(repo, question);
    return res.status(202).json({ message, repo: repoKey, question, status: "queued" });
  }

  try {
    const result = await askQuestion(repoKey, question);
    return res.json({
      repo: repoKey,
      question,
      status: "completed",
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Error in askQuestion:", error);
    return res.status(500).json({ error: error.message || "Failed to answer question" });
  }
});

export default router;

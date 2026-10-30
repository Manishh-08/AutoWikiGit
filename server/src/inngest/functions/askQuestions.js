import { inngest } from "../client.js";
import { askQuestion } from "../../services/rag.js";
import { completeChatJob, failChatJob } from "../../services/chatJobs.js";


export const askQuestionFn = inngest.createFunction(
  { id: "ask-question", triggers: [{ event: "chat/question.requested" }] },
  async ({ event, step }) => {
    const { jobId, repo, question } = event.data;


    try {
      const result = await step.run("retrieve-and-answer", async () => {
        return askQuestion(repo, question);
      });

      await completeChatJob(jobId, result.answer, result.sources);

      return {
        repo,
        question,
        status: "completed",
        answer: result.answer,
        sources: result.sources,
      };
    } catch (error) {
      await failChatJob(jobId, error instanceof Error ? error.message : "Unable to answer question");
      throw error;
    }
  },
);
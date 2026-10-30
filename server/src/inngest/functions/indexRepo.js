import { chunkFiles } from "../../services/chunker.js";
import { fetchRepoFiles } from "../../services/github.js";
import { saveChunks } from "../../services/vectorStore.js";
import { auth } from "../../auth/auth.js";
import { inngest } from "../client.js";

export const indexRepo = inngest.createFunction(
  { id: "index-repo", triggers: [{ event: "repo/index.requested" }] },
  async ({ event, step }) => {
    const { userId, githubAccountId, githubToken: tokenFromUser, owner, repo } = event.data;

    const repoName = repo.replace(/\.git$/, "");
    const repoKey = `${owner}/${repoName}`;

    const result = await step.run("fetch-chunk-and-save", async () => {
      let githubToken = tokenFromUser;

      if (!githubToken && userId && githubAccountId) {
        const { accessToken } = await auth.api.getAccessToken({
          body: {
            userId,
            accountId: githubAccountId,
          },
        });
        githubToken = accessToken;
      }

      const files = await fetchRepoFiles(githubToken, owner, repoName);
      const documents = await chunkFiles(files, repoKey);
      const saveResult = await saveChunks(repoKey, documents);

      return {
        fileCount: files.length,
        chunkCount: documents.length,
        saved: saveResult.saved,
      };
    });

    return {
      repo: repoKey,
      ...result,
    };
  }
);
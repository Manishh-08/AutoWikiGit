import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkFiles(files, repo) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  const documents = [];

  for (const file of files) {
    const safeContent = typeof file.content === "string"
      ? file.content.toWellFormed().replace(/\0/g, "")
      : "";
    const chunks = await splitter.createDocuments(
      [safeContent],
      [{ path: file.path, repo }],
    );
    for (const chunk of chunks) {
      if (typeof chunk.pageContent === "string") {
        chunk.pageContent = chunk.pageContent.toWellFormed().replace(/\0/g, "");
      }
      documents.push(chunk);
    }
  }

  return documents;
}
import "dotenv/config";
import { createHash } from "node:crypto";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  activateBm25Model,
  buildBm25Model,
  createDocumentSparseVector,
  createQuerySparseVector,
  getActiveBm25Model,
  savePendingBm25Model,
} from "./bm25.js";
import { reciprocalRankFusion } from "./rankFusion.js";

const embeddings = new OpenAIEmbeddings({
  model: "openai/text-embedding-3-small",
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const UPSERT_BATCH_SIZE = 100;
const DEFAULT_TOP_K = 5;
const DEFAULT_FETCH_K = Number(process.env.RRF_FETCH_K || 20);

function repoToNamespace(repo) {
  return repo.replace("/", "-");
}

function getIndex(namespace) {
  const indexName = process.env.PINECONE_HYBRID_INDEX || "auto-wiki-git-hybrid-v1";
  return pc.index(indexName).namespace(namespace);
}

function normalizeDocuments(documents) {
  return documents
    .map((doc) => ({
      pageContent: typeof doc.pageContent === "string" ? doc.pageContent : "",
      metadata: doc.metadata ?? {},
    }))
    .filter((doc) => doc.pageContent.trim().length > 0);
}

function buildRecordId(repo, metadata, content) {
  return createHash("sha256")
    .update(`${repo}:${metadata.path ?? ""}:${content}`)
    .digest("hex");
}

export async function saveChunks(repo, documents) {
  const chunks = normalizeDocuments(documents);

  if (!chunks.length) {
    return { saved: false, chunkCount: 0 };
  }

  const namespace = repoToNamespace(repo);
  const index = getIndex(namespace);
  const texts = chunks.map((doc) => doc.pageContent);
  const model = buildBm25Model(texts);
  await savePendingBm25Model(repo, model);
  const vectors = await embeddings.embedDocuments(texts);

  const records = chunks.map((doc, i) => ({
    id: buildRecordId(repo, doc.metadata, doc.pageContent),
    values: vectors[i],
    sparseValues: createDocumentSparseVector(doc.pageContent, model),
    metadata: {
      text: doc.pageContent,
      path: doc.metadata.path,
      repo: doc.metadata.repo ?? repo,
    },
  }));

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    await index.upsert(records.slice(i, i + UPSERT_BATCH_SIZE));
  }
  await activateBm25Model(repo);

  return { saved: true, chunkCount: chunks.length };
}

function toSearchDocument(match) {
  const metadata = match.metadata ?? {};

  return {
    pageContent: metadata.text ?? "",
    metadata: {
      path: metadata.path,
      repo: metadata.repo,
    },
    score: match.score,
  };
}

export async function search(repo, question, topK = DEFAULT_TOP_K) {
  const namespace = repoToNamespace(repo);
  const index = getIndex(namespace);
  const model = await getActiveBm25Model(repo);
  if (!model) {
    throw new Error(`No active sparse-search model exists for ${repo}. Re-index the repository.`);
  }

  const fetchK = Math.max(topK, DEFAULT_FETCH_K);
  const [vector, sparseVector] = await Promise.all([
    embeddings.embedQuery(question),
    Promise.resolve(createQuerySparseVector(question, model)),
  ]);
  const [denseResponse, sparseResponse] = await Promise.all([
    index.query({ vector, topK: fetchK, includeMetadata: true }),
    sparseVector.indices.length
      ? index.query({ sparseVector, topK: fetchK, includeMetadata: true })
      : Promise.resolve({ matches: [] }),
  ]);
  const matches = [...(denseResponse.matches ?? []), ...(sparseResponse.matches ?? [])];
  const byId = new Map();
  for (const match of matches) {
    if (!byId.has(match.id)) byId.set(match.id, match);
  }
  const rankedIds = reciprocalRankFusion([
    (denseResponse.matches ?? []).map((match) => match.id),
    (sparseResponse.matches ?? []).map((match) => match.id),
  ]);

  return rankedIds
    .slice(0, topK)
    .map((id) => toSearchDocument(byId.get(id)))
    .filter((doc) => doc.pageContent.trim().length > 0);
}

export async function getRepoStatus(repo) {
  const namespace = repoToNamespace(repo);
  const indexName = process.env.PINECONE_HYBRID_INDEX || "auto-wiki-git-hybrid-v1";
  const stats = await pc.index(indexName).describeIndexStats();
  const ns = stats.namespaces?.[namespace];
  if (ns && ns.recordCount > 0) {
    return {
      repo,
      status: "ready",
      recordCount: ns.recordCount,
    };
  }
  return {
    repo,
    status: "indexing",
    recordCount: 0,
  };
}

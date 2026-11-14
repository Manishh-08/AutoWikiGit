import "dotenv/config";
import { createHash } from "node:crypto";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let tableReady;

const DEFAULT_K1 = Number(process.env.BM25_K1 || 1.2);
const DEFAULT_B = Number(process.env.BM25_B || 0.75);
const MODEL_VERSION = "bm25-v1";

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function tokenize(text) {
  return (text.match(/[A-Za-z_$][A-Za-z0-9_$]*|[0-9]+|[^A-Za-z0-9_$\s]/g) || [])
    .map((token) => token.toLowerCase());
}

function toSparseVector(weights) {
  const entries = [...weights.entries()].sort(([a], [b]) => a - b);
  return {
    indices: entries.map(([index]) => index),
    values: entries.map(([, value]) => value),
  };
}

function tokenIndex(token) {
  return Number.parseInt(createHash("sha256").update(token).digest("hex").slice(0, 8), 16);
}

export function buildBm25Model(documents, options = {}) {
  const k1 = positiveNumber(options.k1, DEFAULT_K1);
  const b = Number.isFinite(options.b) && options.b >= 0 ? options.b : DEFAULT_B;
  const tokenized = documents.map((document) => tokenize(document));
  const documentFrequency = new Map();
  let totalLength = 0;

  for (const tokens of tokenized) {
    totalLength += tokens.length;
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const documentCount = tokenized.length;
  return {
    version: MODEL_VERSION,
    k1,
    b,
    documentCount,
    averageDocumentLength: documentCount ? totalLength / documentCount : 0,
    vocabulary: Object.fromEntries(
      [...documentFrequency.entries()].map(([token, frequency]) => [
        token,
        { index: tokenIndex(token), documentFrequency: frequency },
      ]),
    ),
  };
}

export function createDocumentSparseVector(text, model) {
  const tokens = tokenize(text);
  const termFrequency = new Map();
  for (const token of tokens) {
    if (model.vocabulary[token]) {
      termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
    }
  }

  const weights = new Map();
  const documentLength = tokens.length;
  const averageLength = model.averageDocumentLength || 1;
  for (const [token, frequency] of termFrequency) {
    const entry = model.vocabulary[token];
    const idf = Math.log(
      1 + (model.documentCount - entry.documentFrequency + 0.5)
        / (entry.documentFrequency + 0.5),
    );
    const denominator = frequency + model.k1
      * (1 - model.b + model.b * documentLength / averageLength);
    weights.set(entry.index, idf * (frequency * (model.k1 + 1)) / denominator);
  }
  return toSparseVector(weights);
}

export function createQuerySparseVector(text, model) {
  return createDocumentSparseVector(text, model);
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS bm25_models (
        repo TEXT PRIMARY KEY,
        model JSONB NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'active')),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }
  await tableReady;
}

export async function savePendingBm25Model(repo, model) {
  await ensureTable();
  await pool.query(
    `INSERT INTO bm25_models (repo, model, status, updated_at)
     VALUES ($1, $2::jsonb, 'pending', NOW())
     ON CONFLICT (repo) DO UPDATE
     SET model = EXCLUDED.model, status = 'pending', updated_at = NOW()`,
    [repo, JSON.stringify(model)],
  );
}

export async function activateBm25Model(repo) {
  await ensureTable();
  await pool.query(
    `UPDATE bm25_models SET status = 'active', updated_at = NOW()
     WHERE repo = $1 AND status = 'pending'`,
    [repo],
  );
}

export async function getActiveBm25Model(repo) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT model FROM bm25_models WHERE repo = $1 AND status = 'active'`,
    [repo],
  );
  return rows[0]?.model ?? null;
}

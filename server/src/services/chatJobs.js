import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let tableReady;

async function ensureTable() {
  if (!tableReady) {
    tableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS chat_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        repo TEXT NOT NULL,
        question TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('queued', 'completed', 'error')),
        answer TEXT,
        sources JSONB NOT NULL DEFAULT '[]'::jsonb,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }

  await tableReady;
}

export async function createChatJob({ id, userId, repo, question }) {
  await ensureTable();
  await pool.query(
    `INSERT INTO chat_jobs (id, user_id, repo, question, status)
     VALUES ($1, $2, $3, $4, 'queued')`,
    [id, userId, repo, question],
  );
}

export async function getChatJob(id, userId) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT id, repo, question, status, answer, sources, error
     FROM chat_jobs
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function completeChatJob(id, answer, sources) {
  await ensureTable();
  await pool.query(
    `UPDATE chat_jobs
     SET status = 'completed', answer = $2, sources = $3::jsonb,
         error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [id, answer, JSON.stringify(sources ?? [])],
  );
}

export async function failChatJob(id, error) {
  await ensureTable();
  await pool.query(
    `UPDATE chat_jobs
     SET status = 'error', error = $2, updated_at = NOW()
     WHERE id = $1`,
    [id, error],
  );
}

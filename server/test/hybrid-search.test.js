import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBm25Model,
  createDocumentSparseVector,
  createQuerySparseVector,
} from "../src/services/bm25.js";
import { reciprocalRankFusion } from "../src/services/rankFusion.js";

test("BM25 produces deterministic, query-compatible sparse vectors", () => {
  const documents = [
    "export function createUser() { return user; }",
    "export function deleteUser() { return deleted; }",
  ];
  const model = buildBm25Model(documents);
  const first = createDocumentSparseVector(documents[0], model);
  const second = createDocumentSparseVector(documents[0], model);
  const query = createQuerySparseVector("createUser", model);

  assert.deepEqual(first, second);
  assert.ok(first.indices.length > 0);
  assert.ok(query.indices.length > 0);
  assert.equal(first.indices.length, first.values.length);
});

test("BM25 ignores terms outside the indexed vocabulary", () => {
  const model = buildBm25Model(["known symbol"]);
  const vector = createQuerySparseVector("unknown symbol", model);

  assert.equal(vector.indices.length, 1);
  assert.equal(vector.values.length, 1);
});

test("RRF prioritizes documents present near the top of both rankings", () => {
  const ranking = reciprocalRankFusion([
    ["dense-only", "shared", "tail"],
    ["shared", "sparse-only", "tail"],
  ]);

  assert.deepEqual(ranking, ["shared", "tail", "dense-only", "sparse-only"]);
});

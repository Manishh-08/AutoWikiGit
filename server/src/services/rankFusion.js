import "dotenv/config";

const DEFAULT_RRF_CONSTANT = Number(process.env.RRF_CONSTANT || 60);

export function reciprocalRankFusion(rankings, constant = DEFAULT_RRF_CONSTANT) {
  const scores = new Map();
  for (const ranking of rankings) {
    ranking.forEach((id, rank) => {
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + rank + 1));
    });
  }
  return [...scores.entries()]
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([id]) => id);
}

import type { OpportunityType } from "../types";

export type PotentialScore = 1 | 2 | 3 | 4 | 5;

export function scoreToPotentialScore(
  score: number,
  opportunity: OpportunityType,
): PotentialScore {
  if (opportunity === "insufficient") {
    return score >= 65 ? 2 : 1;
  }
  if (score >= 80) return 5;
  if (score >= 66) return 4;
  if (score >= 52) return 3;
  if (score >= 38) return 2;
  return 1;
}

export const potentialMeta: Record<
  PotentialScore,
  { label: string; decision: string }
> = {
  1: { label: "潜力很低", decision: "暂不建议开店" },
  2: { label: "潜力偏低", decision: "暂缓开店" },
  3: { label: "潜力中等", decision: "建议先做小范围测试" },
  4: { label: "潜力较高", decision: "建议筹备开店" },
  5: { label: "潜力很高", decision: "建议优先开店" },
};

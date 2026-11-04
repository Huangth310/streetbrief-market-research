import { describe, expect, it } from "vitest";
import { potentialMeta, scoreToPotentialScore } from "./potential";

describe("potential score", () => {
  it("maps stronger markets to higher five-level scores", () => {
    expect(scoreToPotentialScore(35, "insufficient")).toBe(1);
    expect(scoreToPotentialScore(58, "mature_entry")).toBe(3);
    expect(scoreToPotentialScore(69, "mature_entry")).toBe(4);
    expect(scoreToPotentialScore(82, "mature_entry")).toBe(5);
  });

  it("gives every level an explicit recommendation", () => {
    for (const score of [1, 2, 3, 4, 5] as const) {
      expect(potentialMeta[score].decision.length).toBeGreaterThan(3);
    }
    expect(potentialMeta[1].decision).toBe("暂不建议开店");
  });
});

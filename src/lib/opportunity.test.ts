import { describe, expect, it } from "vitest";
import { classifyMarketOpportunity } from "../../server/report-builder.mjs";

describe("classifyMarketOpportunity", () => {
  it("does not treat low competition alone as a supply gap", () => {
    expect(
      classifyMarketOpportunity({
        directCompetitorCount: 1,
        coverage: 90,
        anchorCount: 3,
      }),
    ).toBe("insufficient");

    expect(
      classifyMarketOpportunity({
        directCompetitorCount: 2,
        coverage: 90,
        anchorCount: 3,
      }),
    ).toBe("insufficient");

    expect(
      classifyMarketOpportunity({
        directCompetitorCount: 3,
        coverage: 90,
        anchorCount: 3,
      }),
    ).toBe("mature_entry");
  });

  it("requires demand and evidence thresholds before a market conclusion", () => {
    expect(
      classifyMarketOpportunity({
        directCompetitorCount: 8,
        coverage: 70,
        anchorCount: 0,
      }),
    ).toBe("insufficient");

    expect(
      classifyMarketOpportunity({
        directCompetitorCount: 5,
        coverage: 70,
        anchorCount: 2,
      }),
    ).toBe("mature_entry");
  });
});

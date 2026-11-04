import { describe, expect, it } from "vitest";
import { buildDemoReport, isCategoryKey } from "./analysis";

describe("buildDemoReport", () => {
  it("keeps the requested category when one is supplied", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "targeted",
      category: "light",
    });

    expect(report.category).toBe("light");
    expect(report.profile.label).toContain("轻食");
    expect(report.competitors.every((item) => item.categoryLabel.includes("轻食"))).toBe(
      true,
    );
  });

  it("marks unverified competitors below the evidence threshold", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "targeted",
      category: "coffee",
    });
    const unverified = report.competitors.filter((item) => item.completeness < 60);

    expect(unverified.length).toBeGreaterThan(0);
    expect(unverified.every((item) => item.priceBand === null)).toBe(true);
  });

  it("always separates facts, inferences and recommendations", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "discover",
    });

    expect(report.facts.some((item) => item.layer === "fact")).toBe(true);
    expect(report.facts.some((item) => item.layer === "inference")).toBe(true);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.sample).toBe(true);
    expect(report.landmarks.length).toBeGreaterThan(0);
    expect(report.profile.categoryBoundary.length).toBeGreaterThan(10);
    expect(report.profile.potentialScore).toBeGreaterThanOrEqual(1);
    expect(report.profile.potentialScore).toBeLessThanOrEqual(5);
    expect(report.analysisSummary.length).toBeGreaterThan(30);
  });

  it("validates supported category keys", () => {
    expect(isCategoryKey("coffee")).toBe(true);
    expect(isCategoryKey("clinic")).toBe(false);
  });

  it("keeps every conclusion traceable to existing evidence", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "discover",
    });
    const evidenceIds = new Set(report.evidence.map((item) => item.id));
    const references = [
      ...report.facts.flatMap((item) => item.evidenceIds),
      ...report.segments.flatMap((item) => item.evidenceIds),
      ...report.opportunities.flatMap((item) => item.evidenceIds),
      ...report.recommendations.flatMap((item) => item.evidenceIds),
      ...report.competitors.flatMap((item) => item.evidenceIds),
    ];

    expect(references.length).toBeGreaterThan(0);
    expect(references.every((id) => evidenceIds.has(id))).toBe(true);
  });

  it("stores price bands as display-ready strings", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "targeted",
      category: "coffee",
    });
    const prices = report.competitors
      .map((item) => item.priceBand)
      .filter((value): value is string => Boolean(value));

    expect(prices.length).toBeGreaterThan(0);
    expect(
      prices.every(
        (value) => value === "待验证" || value.includes("元"),
      ),
    ).toBe(true);
  });

  it("keeps open-category ranking scores explainable", () => {
    const report = buildDemoReport({
      address: "中山大学珠海校区东门",
      mode: "discover",
    });

    for (const item of report.ranking) {
      const subtotal = Object.values(item.breakdown).reduce(
        (total, value) => total + value,
        0,
      );
      expect(subtotal).toBe(item.score);
      expect(item.missingData.length).toBeGreaterThan(0);
    }
  });
});

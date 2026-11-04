import { describe, expect, it } from "vitest";
import { matchesCategory } from "../../server/report-builder.mjs";

describe("matchesCategory", () => {
  it("assigns a mixed fruit-tea coffee shop to its primary tea category", () => {
    const poi = {
      name: "萃柠果茶咖啡店",
      type: "餐饮服务;冷饮店;冷饮店",
      typecode: "050600",
    };

    expect(matchesCategory(poi, "coffee")).toBe(false);
    expect(matchesCategory(poi, "tea")).toBe(true);
  });

  it("keeps a true coffee shop in the coffee category", () => {
    const poi = {
      name: "豆取咖啡",
      type: "餐饮服务;咖啡厅;咖啡厅",
      typecode: "050500",
    };

    expect(matchesCategory(poi, "coffee")).toBe(true);
    expect(matchesCategory(poi, "tea")).toBe(false);
  });
});

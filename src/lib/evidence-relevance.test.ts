import { describe, expect, it } from "vitest";
import { isRelevantWebResult } from "../../server/report-builder.mjs";

describe("isRelevantWebResult", () => {
  const competitor = { name: "瑞幸咖啡(中山大学珠海校区店)" };
  const poi = { address: "广东省珠海市香洲区唐家湾镇中山大学珠海校区" };

  it("accepts a page that names the matched branch", () => {
    expect(
      isRelevantWebResult(competitor, poi, {
        title: "luckin coffee瑞幸咖啡（中山大學珠海校區店）",
        content: "地址：唐家湾若海路中山大学珠海校区教学楼",
      }),
    ).toBe(true);
  });

  it("rejects another branch with the same brand", () => {
    expect(
      isRelevantWebResult(competitor, poi, {
        title: "瑞幸咖啡（B区）_珠海机场",
        content: "珠海机场候机楼B区B11登机口旁",
      }),
    ).toBe(false);
  });
});

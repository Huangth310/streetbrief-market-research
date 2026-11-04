import { describe, expect, it } from "vitest";
import { pickAddressPoi } from "../../server/providers.mjs";

describe("pickAddressPoi", () => {
  it("prefers a named campus gate over the campus center", () => {
    const pois = [
      { name: "中山大学珠海校区", address: "大学路2号" },
      { name: "中山大学珠海校区华夏门", address: "唐家湾镇大学路" },
    ];

    expect(pickAddressPoi("中山大学珠海校区华夏门", pois)?.name).toBe(
      "中山大学珠海校区华夏门",
    );
  });

  it("falls back to geocoding when no named landmark matches", () => {
    expect(
      pickAddressPoi("珠海市香洲区", [
        { name: "珠海机场", address: "金湾机场路" },
      ]),
    ).toBeNull();
  });

  it("does not mistake a campus center for a specific gate", () => {
    expect(
      pickAddressPoi("中山大学珠海校区北门", [
        { name: "中山大学珠海校区", address: "大学路2号" },
        { name: "中山大学珠海校区国际金融学院", address: "海琴6号" },
      ]),
    ).toBeNull();
  });
});

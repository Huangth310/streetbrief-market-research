import { describe, expect, it } from "vitest";
import { gcj02ToWgs84 } from "./coordinates";

describe("gcj02ToWgs84", () => {
  it("removes the mainland China map offset before rendering on WGS84 tiles", () => {
    const converted = gcj02ToWgs84({ lat: 39.915, lng: 116.404 });

    expect(converted.lat).toBeCloseTo(39.913596, 5);
    expect(converted.lng).toBeCloseTo(116.397756, 5);
  });

  it("keeps coordinates outside mainland China unchanged", () => {
    expect(gcj02ToWgs84({ lat: 35.6762, lng: 139.6503 })).toEqual({
      lat: 35.6762,
      lng: 139.6503,
    });
  });
});

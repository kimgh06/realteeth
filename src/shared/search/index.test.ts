import { describe, it, expect, beforeEach } from "vitest";
import { searchDistricts, clearCache } from "./index";

describe("searchDistricts", () => {
  beforeEach(() => {
    clearCache();
  });

  it("returns empty array for empty query", () => {
    expect(searchDistricts("")).toEqual([]);
    expect(searchDistricts("   ")).toEqual([]);
  });

  it("returns results for single term", () => {
    const results = searchDistricts("서울");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toContain("서울");
  });

  it("returns results for multi-term query", () => {
    const results = searchDistricts("서울 종로구");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toContain("서울");
    expect(results[0]?.name).toContain("종로");
  });

  it("prioritizes exact matches", () => {
    const results = searchDistricts("서울특별시");
    expect(results[0]?.code).toBe("11");
  });

  it("returns max 20 results by default", () => {
    const results = searchDistricts("서울");
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it("respects custom limit", () => {
    const results = searchDistricts("서울", 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("case insensitive", () => {
    const r1 = searchDistricts("seoul");
    const r2 = searchDistricts("SEOUL");
    expect(r1.length).toBe(r2.length);
  });

  it("caches results", () => {
    const r1 = searchDistricts("부산");
    const r2 = searchDistricts("부산");
    expect(r1).toEqual(r2);
  });
});

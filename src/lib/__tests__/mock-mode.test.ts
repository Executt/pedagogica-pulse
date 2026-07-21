import { describe, it, expect, beforeEach } from "vitest";
import {
  getMockData,
  resetMockData,
  exportMockData,
  importMockData,
  setMockMode,
  isMockModeEnabled,
} from "@/lib/mock-mode";

describe("mock-mode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds default data on first read", () => {
    const d = getMockData();
    expect(d.materials.length).toBeGreaterThan(0);
    expect(d.classes.length).toBeGreaterThan(0);
  });

  it("toggles mock mode (default ON)", () => {
    expect(isMockModeEnabled()).toBe(true);
    setMockMode(false);
    expect(isMockModeEnabled()).toBe(false);
    setMockMode(true);
    expect(isMockModeEnabled()).toBe(true);
  });

  it("reset recreates the seed", () => {
    const before = getMockData();
    before.materials = [];
    localStorage.setItem("ip-mock-data-v1", JSON.stringify(before));
    const fresh = resetMockData();
    expect(fresh.materials.length).toBeGreaterThan(0);
  });

  it("export -> import round-trips", () => {
    const json = exportMockData();
    const parsed = JSON.parse(json);
    parsed.announcements = [];
    const restored = importMockData(JSON.stringify(parsed));
    expect(restored.announcements).toEqual([]);
    expect(getMockData().announcements).toEqual([]);
  });

  it("import rejects invalid payload", () => {
    expect(() => importMockData("{}")).toThrow();
    expect(() => importMockData("not json")).toThrow();
  });
});
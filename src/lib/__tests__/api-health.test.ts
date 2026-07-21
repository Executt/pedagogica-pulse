import { describe, it, expect, beforeEach } from "vitest";
import {
  recordSuccess,
  recordFailure,
  inCooldown,
  resetHealth,
  getApiStatus,
  getHealthSnapshot,
  __testing,
} from "@/lib/api-health";

describe("api-health circuit breaker", () => {
  beforeEach(() => resetHealth());

  it("starts clean (unknown when no calls yet)", () => {
    expect(inCooldown()).toBe(false);
    expect(getApiStatus(false)).toBe("unknown");
  });

  it("recordSuccess -> status ok", () => {
    recordSuccess();
    expect(getApiStatus(false)).toBe("ok");
    expect(getHealthSnapshot().consecutiveFailures).toBe(0);
  });

  it("single failure is degraded, not cooldown", () => {
    recordFailure(new Error("boom"));
    expect(getApiStatus(false)).toBe("degraded");
    expect(inCooldown()).toBe(false);
  });

  it("N failures trigger cooldown", () => {
    for (let i = 0; i < __testing.FAIL_THRESHOLD; i++) recordFailure(new Error("boom"));
    expect(inCooldown()).toBe(true);
    expect(getApiStatus(false)).toBe("cooldown");
  });

  it("success resets counter and cooldown", () => {
    for (let i = 0; i < __testing.FAIL_THRESHOLD; i++) recordFailure(new Error("x"));
    expect(inCooldown()).toBe(true);
    recordSuccess();
    expect(inCooldown()).toBe(false);
    expect(getApiStatus(false)).toBe("ok");
  });

  it("mock mode overrides status", () => {
    recordFailure(new Error("x"));
    expect(getApiStatus(true)).toBe("unknown");
  });
});
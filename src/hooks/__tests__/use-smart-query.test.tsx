import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSmartQuery } from "@/hooks/use-smart-query";
import { setMockMode } from "@/lib/mock-mode";
import { resetHealth, getHealthSnapshot, __testing } from "@/lib/api-health";

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useSmartQuery", () => {
  beforeEach(() => {
    localStorage.clear();
    resetHealth();
    setMockMode(false);
  });

  it("returns API data on success", async () => {
    const apiFn = vi.fn().mockResolvedValue(["api"]);
    const mockFn = vi.fn(() => ["mock"]);
    const { result } = renderHook(
      () => useSmartQuery({ queryKey: ["k1"], apiFn, mockFn }),
      { wrapper: wrap() },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.source).toBe("api");
    expect(result.current.data?.data).toEqual(["api"]);
    expect(getHealthSnapshot().consecutiveFailures).toBe(0);
  });

  it("falls back to mock on API failure and records the failure", async () => {
    const apiFn = vi.fn().mockRejectedValue(new Error("500"));
    const mockFn = vi.fn(() => ["mock"]);
    const { result } = renderHook(
      () => useSmartQuery({ queryKey: ["k2"], apiFn, mockFn }),
      { wrapper: wrap() },
    );
    await waitFor(() => expect(result.current.data?.source).toBe("fallback"));
    expect(result.current.data?.data).toEqual(["mock"]);
    expect(result.current.isError).toBe(false);
    expect(getHealthSnapshot().consecutiveFailures).toBeGreaterThan(0);
  });

  it("skips the API while in cooldown", async () => {
    // trip breaker
    for (let i = 0; i < __testing.FAIL_THRESHOLD; i++) {
      __testing.setState({ consecutiveFailures: i + 1, cooldownUntil: Date.now() + 60_000 });
    }
    const apiFn = vi.fn().mockResolvedValue(["api"]);
    const mockFn = vi.fn(() => ["mock"]);
    const { result } = renderHook(
      () => useSmartQuery({ queryKey: ["k3"], apiFn, mockFn }),
      { wrapper: wrap() },
    );
    await waitFor(() => expect(result.current.data?.source).toBe("fallback"));
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("uses mock immediately in demo mode without hitting API", async () => {
    setMockMode(true);
    const apiFn = vi.fn();
    const mockFn = vi.fn(() => ["mock"]);
    const { result } = renderHook(
      () => useSmartQuery({ queryKey: ["k4"], apiFn, mockFn }),
      { wrapper: wrap() },
    );
    await waitFor(() => expect(result.current.data?.source).toBe("mock"));
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("retry recovers after transient failure", async () => {
    let n = 0;
    const apiFn = vi.fn(async () => {
      n++;
      if (n === 1) throw new Error("temp");
      return ["api"];
    });
    const mockFn = vi.fn(() => ["mock"]);
    const { result } = renderHook(
      () => useSmartQuery({ queryKey: ["k5"], apiFn, mockFn }),
      { wrapper: wrap() },
    );
    await waitFor(() => expect(result.current.data?.source).toBe("fallback"));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.data?.source).toBe("api"));
    expect(getHealthSnapshot().consecutiveFailures).toBe(0);
  });
});
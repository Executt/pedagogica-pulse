import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePaginated } from "@/hooks/use-paginated";

describe("usePaginated", () => {
  it("shows first page and loads more incrementally", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const { result } = renderHook(() => usePaginated(items, 10));
    expect(result.current.visible).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);
    act(() => result.current.loadMore());
    expect(result.current.visible).toHaveLength(20);
    act(() => result.current.loadMore());
    expect(result.current.visible).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);
  });

  it("resets when items length changes", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const { result, rerender } = renderHook(({ arr }) => usePaginated(arr, 10), {
      initialProps: { arr: items },
    });
    act(() => result.current.loadMore());
    expect(result.current.visible).toHaveLength(20);
    rerender({ arr: items.slice(0, 5) });
    expect(result.current.visible).toHaveLength(5);
  });
});
import { useEffect, useState } from "react";

/**
 * Paginação client-side simples: dado um array já carregado, expõe
 * apenas os N primeiros itens e um `loadMore()` incremental. Reseta
 * quando o total muda (ex: filtros/busca).
 */
export function usePaginated<T>(items: T[], pageSize = 10) {
  const [count, setCount] = useState(pageSize);

  useEffect(() => {
    setCount(pageSize);
  }, [items.length, pageSize]);

  const visible = items.slice(0, count);
  const hasMore = items.length > visible.length;
  return {
    visible,
    hasMore,
    loadMore: () => setCount((c) => c + pageSize),
    reset: () => setCount(pageSize),
  };
}
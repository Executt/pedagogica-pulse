# Arquitetura

## Stack
- React 19 + TypeScript + TanStack Start (Vite 7), roteamento por arquivos.
- Tailwind CSS v4 (`src/styles.css`) + shadcn/ui + lucide-react.
- TanStack Query (com persistência local 24h) para estado servidor.
- Backend gerenciado (Postgres + Auth + Storage + PostgREST) via cliente gerado.
- `pdfjs-dist` para extração de texto do PDF oficial de escolas.
- Vitest para testes de domínio/hooks.

## Camadas (Clean Architecture / DDD)
```text
src/domain/          regras puras (education, org, rbac, import) — sem I/O
src/application/     ports (interfaces) + use cases
src/infrastructure/  adapters Supabase e Mock + container (composition root)
src/hooks/           interface: hooks React que chamam use cases
src/routes/          telas (file-based) e rotas HTTP públicas
src/components/      UI compartilhada
src/lib/             utilitários e server functions
```
Regra de dependência: `routes → hooks → use cases → ports ← infrastructure`.
A UI nunca importa Supabase diretamente.

## Diretórios de destaque
- `src/domain/import/school-pdf.ts` — parser e validação do PDF.
- `src/domain/import/review.ts` — agrupamentos em lote e diff PDF × base.
- `src/domain/import/csv.ts` — exportação CSV do histórico.
- `src/domain/org/scope.ts` — filtro hierárquico Secretaria→Regional→Distrito→Escola.
- `src/lib/pulse*.ts` — integração assinada (HMAC) com o sistema web.
- `src/lib/mock-mode.ts`, `src/lib/api-health.ts` — modo demo e circuit breaker.

## Rotas
Layout autenticado `src/routes/_authenticated/route.tsx` (gate de sessão) e rotas
públicas `src/routes/api/public/pulse/*` para integração externa.

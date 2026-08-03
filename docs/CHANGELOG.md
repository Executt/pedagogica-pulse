# Changelog

## Fase 0 — Fundação (2026-08-03)

### Adicionado
- Camada de domínio `src/domain/education` (tipos e regras puras: headcount, distribuição de risco, frequência média).
- Camada de aplicação: ports `ClassRepository`/`StudentRepository` e casos de uso de Educação.
- Infraestrutura: repositórios Supabase e Mock implementando os mesmos ports, com composition root em `src/infrastructure/container.ts`.
- Hooks `useClasses`, `useClassDetail`, `useStudentDetail` como única porta de entrada da UI.
- Documentação: `docs/architecture.md`, ADR-001 (Clean Architecture) e ADR-002 (Integration Hub).

### Alterado
- `turmas.index`, `turmas.$classId` e `alunos.$studentId` deixaram de acessar Supabase e mock-mode diretamente.
- `useSmartQuery` passou a aceitar `mockFn` assíncrono, permitindo repositórios uniformes.

### Corrigido
- Erros de tipagem em `pulse-serve.server.ts` (consulta dinâmica) e `query-persist.ts` (duplicidade de `query-core`).

### Preservado
- Usuário Root e superadmin, políticas RLS, rotas `/api/public/pulse/*` (v0) e comportamento visível das telas.

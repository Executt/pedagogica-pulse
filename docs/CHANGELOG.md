# Changelog

## Fase 1 — Core organizacional e RBAC hierárquico (2026-08-05)

### Adicionado
- Tabela `org_units` (Secretaria → Subsecretaria → Regional → Distrito) com trigger anti-ciclo e RLS.
- Cadastro completo de escolas: INEP, CNPJ, endereço, CEP, geo, modalidades, turnos, capacidade, situação.
- Escopo por unidade organizacional em `user_roles` (+ perfis secretário, subsecretário, gestor regional, gestor distrital, coordenador).
- Funções `user_org_unit_ids()`, `user_scope_school_ids()`, `has_org_unit_access()`; `has_school_access()` passa a herdar acesso pela hierarquia.
- Domínio `src/domain/org` (árvore, descendentes, caminho) e `src/domain/rbac` (capacidades por perfil).
- Port + repositório Supabase de Organização, casos de uso e hooks `useOrgTree`, `useNetworkSchools`, `useMyScope`, `useRbac`.
- Importador inteligente do PDF de escolas: `src/domain/import/school-pdf.ts` (parser puro), `src/lib/pdf-text.ts` (pdf.js) e tela `/admin/importador` com revisão manual de inconsistências.
- Documento `docs/fase-1-rollback-e-aceite.md` (impacto, índices, rollback e testes de aceitação).

### Alterado
- `school_id` em `user_roles` passou a ser opcional; telas Home, Agenda e Registros tratam o valor nulo.

### Preservado
- Root e superadmin com acesso total; nenhuma tabela, coluna ou policy removida.

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

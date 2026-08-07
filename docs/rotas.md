# Rotas

## Front (file-based, TanStack Router)
| Rota | Tela | Acesso |
| --- | --- | --- |
| `/` | Landing/redirecionamento | Público |
| `/auth` | Login e cadastro | Público |
| `/home` | Painel do usuário | Autenticado |
| `/turmas`, `/turmas/$classId` | Turmas e detalhe | Autenticado (escopo) |
| `/alunos`, `/alunos/$studentId` | Alunos da rede e ficha | Autenticado (escopo) |
| `/escolas` | Escolas da rede | Autenticado (escopo) |
| `/registros` | Upload e catálogo de materiais | Autenticado |
| `/curadoria` | Sugestões de IA | Diretor, Pedagogo, Superadmin |
| `/agenda`, `/comunicados` | Agenda e comunicados | Autenticado |
| `/perfil` | Perfil, modo demo, integração | Autenticado |
| `/admin/importador` | Importador de PDF | `school:import` |
| `/admin/importacoes` | Histórico + exportação CSV | `school:import` |
| `/admin/auditoria` | Trilha de auditoria | Superadmin |

## RBAC
Capacidades em `src/domain/rbac/roles.ts`; papéis: `superadmin`, `secretario`,
`subsecretario`, `gestor_regional`, `gestor_distrital`, `coordenador`, `diretor`,
`pedagogo`, `professor`. A UI usa `useRbac().can(capability)`; o banco reforça via RLS.

## Query params e estado de filtro
O filtro hierárquico (`OrgScopeFilter`) mantém `{ unitId, schoolId }` em estado de tela;
listas paginadas usam `usedPaginated` com tamanho de página incremental.

## Rotas HTTP públicas
`GET /api/public/pulse/escolas | turmas | alunos | registros | observacoes | agenda | sugestoes`
— exigem token e assinatura HMAC; nunca retornam PII sensível sem escopo.

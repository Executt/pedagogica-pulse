# Banco de Dados — Visão Consolidada

## Domínios
| Domínio | Tabelas |
| --- | --- |
| Organização | `org_units`, `schools` |
| Identidade/RBAC | `profiles`, `user_roles` |
| Pedagógico | `classes`, `students`, `observations`, `ai_suggestions` |
| Registros/Conteúdo | `materials`, `announcements`, `events` |
| Governança | `audit_log`, `import_runs` |
| Integração | `configuracoes_integracao`, `logs_integracao` |

## Funções (security definer)
- `is_superadmin(uuid)` — papel global.
- `user_org_unit_ids()` — CTE recursiva: unidades do usuário e descendentes.
- `user_school_ids()` / `user_scope_school_ids()` — escolas diretas e por hierarquia.
- `has_school_access(uuid)` / `has_org_unit_access(uuid)` — predicados usados nas RLS.
- `list_all_schools()` — leitura enxuta para seletores.
- Triggers: `handle_new_user`, `set_updated_at`, `org_units_no_cycle`,
  `audit_school_org_unit`, `audit_user_roles`.

## GRANTs
Padrão por tabela de usuário:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;
```
`anon` não recebe GRANT em nenhuma tabela: todo acesso público passa pelas rotas
`/api/public/pulse/*` com verificação de assinatura. `user_roles` concede apenas
`SELECT` a `authenticated` (escrita via migration/admin).

## Backup e retenção
Backups automáticos diários do provedor. `audit_log` e `logs_integracao` são
append-only (sem UPDATE/DELETE por RLS) e retêm o histórico integral.

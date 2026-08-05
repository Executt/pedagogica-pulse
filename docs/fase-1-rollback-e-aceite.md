# Fase 1 — Impacto, rollback e testes de aceitação

## 1. Impacto no banco

| Objeto | Mudança | Impacto |
|---|---|---|
| `org_units` (nova) | Hierarquia auto-referente Secretaria→Subsecretaria→Regional→Distrito, com trigger anti-ciclo e `updated_at` | Nenhuma tabela existente é lida por ela; RLS própria |
| `schools` | +`org_unit_id` e 15 colunas de cadastro (INEP, CNPJ, endereço, geo, modalidades, turnos, capacidade, `active`, `updated_at`) | Todas nullable ou com default → `SELECT *` existente continua válido |
| `user_roles` | +`org_unit_id`; `school_id` passa a aceitar `NULL`; CHECK exige escopo (escola, unidade ou superadmin) | Linhas atuais permanecem válidas; **código cliente precisou tratar `school_id` nullable** (feito) |
| `app_role` | +`secretario`, `subsecretario`, `gestor_regional`, `gestor_distrital`, `coordenador` | Aditivo; enum não perde valores |
| `has_school_access` | Passa a considerar herança por unidade organizacional | Todas as policies que já a usavam (turmas, alunos, registros, agenda, comunicados, sugestões) ganham o alcance hierárquico automaticamente, sem reescrita |
| Novas funções | `user_org_unit_ids()` (recursiva), `user_scope_school_ids()`, `has_org_unit_access()` | `SECURITY DEFINER`, `STABLE`, `search_path=public`, `EXECUTE` só para `authenticated`/`service_role` |

### Índices

- `idx_org_units_parent`, `idx_org_units_type` — suportam a CTE recursiva de descendentes.
- `uq_schools_inep` (parcial, `WHERE inep_code IS NOT NULL`) — idempotência do importador.
- `idx_schools_org_unit` — filtro por regional/distrito nas policies e nos painéis.
- `idx_user_roles_user`, `idx_user_roles_school`, `idx_user_roles_org_unit` — cada avaliação de RLS faz lookup por `user_id`; sem eles o custo cresce linearmente com o número de vínculos da rede.

Custo esperado: a recursão roda uma vez por consulta (função `STABLE`, cacheável no plano) e opera sobre dezenas de unidades — desprezível frente ao ganho de escopo.

## 2. Plano de rollback

A migration é **100% aditiva**: nenhum `DROP TABLE`, `DROP COLUMN` ou remoção de policy antiga.

**Rollback parcial (recomendado, sem perda de dados) — restaura o comportamento anterior em segundos:**

```sql
CREATE OR REPLACE FUNCTION public.has_school_access(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_superadmin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND school_id = _school_id
  );
$$;
```

Isso desliga a herança hierárquica mantendo tabelas, colunas e dados importados intactos.

**Rollback total (só se a Fase 1 for abandonada):**

```sql
DROP POLICY IF EXISTS "org units select scoped" ON public.org_units;
DROP POLICY IF EXISTS "org units insert superadmin" ON public.org_units;
DROP POLICY IF EXISTS "org units update superadmin" ON public.org_units;
DROP POLICY IF EXISTS "schools insert superadmin" ON public.schools;
DROP POLICY IF EXISTS "schools update superadmin" ON public.schools;
-- restaurar has_school_access (bloco acima)
DROP FUNCTION IF EXISTS public.has_org_unit_access(uuid);
DROP FUNCTION IF EXISTS public.user_scope_school_ids();
DROP FUNCTION IF EXISTS public.user_org_unit_ids();
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_scope_chk;
UPDATE public.user_roles SET school_id = school_id WHERE school_id IS NOT NULL; -- checagem
-- só reative NOT NULL depois de garantir que não há vínculos apenas por unidade:
-- ALTER TABLE public.user_roles ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS org_unit_id;
ALTER TABLE public.schools DROP COLUMN IF EXISTS org_unit_id;
DROP TABLE IF EXISTS public.org_units CASCADE;
```

Limitações conhecidas: valores adicionados a um `ENUM` não podem ser removidos no Postgres — os novos perfis permanecem no tipo mesmo após o rollback (inofensivo). Frontend: reverter para o commit anterior à Fase 1.

## 3. Testes de aceitação antes de aprovar

**Permissões (bloqueantes)**
1. Login como `admin@ana.gov.br` (superadmin): Home, Turmas, Alunos, Registros, Agenda e Perfil carregam exatamente como antes; Perfil mostra "Importador de escolas".
2. Login como `executt@gmail.com` (Root/superadmin): mesmo resultado — nenhuma perda de acesso.
3. Usuário com vínculo apenas de escola (diretor/professor): continua vendo somente a sua escola; o item "Importador" não aparece.
4. Criar uma regional com duas escolas e vincular um `gestor_regional` à regional (sem `school_id`): ele passa a ver as duas escolas, turmas e alunos — e nenhuma escola de outra regional.
5. Tentar `INSERT` em `org_units` com um usuário não superadmin: deve falhar por política.
6. Tentar criar uma unidade cujo pai seja ela mesma ou um descendente: deve falhar com "ciclo detectado".

**Dados e integridade**
7. `SELECT count(*)` em `schools`, `classes`, `students`, `materials` antes e depois: valores idênticos.
8. Inserir duas escolas com o mesmo INEP: a segunda deve ser rejeitada pelo índice único.

**Importador**
9. Subir o PDF oficial: conferir número de escolas detectadas, unidades detectadas e a lista de inconsistências.
10. Reimportar o mesmo PDF: resultado deve ser `0 novas / N atualizadas` (idempotência).
11. Escola com CNPJ inválido ou INEP duplicado deve aparecer bloqueada e não ser importada.

**Regressão automatizada**
12. `vitest run` — 34 testes, incluindo RBAC, hierarquia e parser do PDF.

## 4. Nota sobre o linter de segurança

O linter sinaliza as funções `SECURITY DEFINER` executáveis por usuários autenticados
(`is_superadmin`, `has_school_access`, `has_org_unit_access`, `user_org_unit_ids`,
`user_scope_school_ids`, `user_school_ids`, `list_all_schools`). Isso é **intencional e necessário**:
é o padrão `has_role` recomendado para evitar recursão em RLS. Todas são `STABLE`, têm
`search_path = public` fixo, respondem apenas sobre o escopo de `auth.uid()` e não aceitam
identidade como parâmetro controlável pelo chamador (exceto `is_superadmin`, que apenas lê
vínculos já visíveis). `EXECUTE` foi revogado de `anon` e de `PUBLIC`.
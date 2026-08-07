# Políticas de Segurança (RLS, Autenticação, Autorização)

## Autenticação
E-mail/senha com confirmação; sem cadastro anônimo. Sessão JWT gerenciada pelo cliente
oficial. Rotas privadas protegidas pelo gate `_authenticated`.

## Autorização
Papéis em `user_roles` (nunca em `profiles`), avaliados por funções `security definer`
para evitar recursão de policy. Capacidades de UI em `src/domain/rbac/roles.ts`.

## RLS por tabela
- `schools`, `classes`, `students`, `materials`, `events`, `announcements`,
  `ai_suggestions`, `observations`: leitura/escrita condicionadas a `has_school_access`.
- `org_units`: leitura por `has_org_unit_access`; escrita apenas superadmin.
- `user_roles`: usuário lê apenas os próprios papéis.
- `audit_log`, `logs_integracao`: leitura somente superadmin; sem INSERT/UPDATE/DELETE
  pelo cliente (append via trigger/service role).
- `import_runs`: usuário vê os próprios; superadmin vê todos.
- `configuracoes_integracao`: superadmin apenas.

## Storage
Bucket `materials` privado; acesso por URL assinada e escopo de escola.

## Segredos
Somente no servidor. Chaves de serviço nunca expostas ao cliente nem logadas.

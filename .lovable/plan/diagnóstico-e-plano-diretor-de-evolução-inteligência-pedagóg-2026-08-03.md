# Diagnóstico e Plano Diretor de Evolução — Inteligência Pedagógica

## 1. Arquitetura atual

Aplicação **TanStack Start v1 + React 19 + Vite 7 + Tailwind v4**, backend **Lovable Cloud (Postgres + Auth + Storage)**. Não há Edge Functions: a lógica de servidor usa `createServerFn` e rotas de servidor em `src/routes/api/public/pulse/*`.

```text
src/
  routes/            __root, index (landing), auth, _authenticated/* (7 telas), api/public/pulse/* (7 rotas)
  components/        mobile-shell, api-status-badge, query-state, ui/ (shadcn)
  hooks/             use-smart-query, use-paginated, use-current-user, use-mobile
  lib/               pulse.server, pulse-serve.server, pulse-read/sync/admin.functions,
                     mock-mode, api-health, query-persist, error-*
supabase/migrations  9 migrations
```

Banco: `profiles`, `schools`, `classes`, `students`, `observations`, `materials`, `events`, `announcements`, `ai_suggestions`, `user_roles`, `configuracoes_integracao`, `logs_integracao`. RLS ativa em todas, com funções `SECURITY DEFINER` (`is_superadmin`, `has_school_access`, `user_school_ids`).

## 2. Ativos reutilizáveis (não recriar)

| Ativo | Papel na nova arquitetura |
|---|---|
| `src/lib/pulse.server.ts` (HMAC, nonce, timestamp, verificação) | Núcleo de segurança do **Integration Hub** |
| `src/routes/api/public/pulse/*` | Base do **API Gateway** (migrar para `/api/v1/*`) |
| `logs_integracao` + `configuracoes_integracao` | Auditoria e credenciais de conectores |
| `use-smart-query` + `api-health` (circuit breaker) | Política de resiliência dos conectores |
| `use-paginated`, `query-state`, `query-persist` | Padrões de listagem/cache de toda a plataforma |
| `user_roles` + `has_role`-like functions | Base do RBAC hierárquico |
| `mobile-shell`, `ui/` shadcn, tokens em `styles.css` | Design System |

## 3. Lacunas e riscos

**Módulos ausentes:** hierarquia organizacional (Secretaria→Subsecretaria→Regional→Distrito), matrículas, frequência, avaliações/boletins, disciplinas, servidores, responsáveis, planos de ensino/PEI, ocorrências, conselho pedagógico, busca ativa, inclusão, importador de escolas, LDAP/AD, MFA, analytics executivo, i18n, dark mode.

**Módulos incompletos:** escolas (só nome/cidade — faltam INEP, CNPJ, endereço, geo, gestores, modalidades, turnos, capacidade); `ai_suggestions` sem camada de provedor de IA; sincronização Pulse sem retry/DLQ.

**Riscos técnicos:**
1. `mock-mode` embutido nas telas — precisa virar *fake repository* atrás da camada de domínio, senão a regra de negócio nasce duplicada.
2. `user_roles` é plano (`user_id, school_id, role`) — não suporta escopo por regional/distrito. Migração obrigatória e sensível: **o Root e o superadmin existentes não podem perder acesso**.
3. Rotas `/api/public/pulse/*` não são versionadas; congelar como `v0` e criar `/api/v1` em paralelo.
4. UI hoje é *mobile-only*; painéis de Secretário/Regional exigem shell responsivo desktop.
5. Sem soft delete, histórico ou trilha de auditoria nas tabelas de domínio.

**Duplicações a eliminar:** dois caminhos de leitura (mock local vs. Pulse remoto) sem contrato comum; lógica de escola/turma repetida em `turmas.$classId`, `alunos.$studentId` e `home`.

**Pendência de insumo:** o PDF oficial das escolas não está anexado nesta conversa — o importador será construído com parser genérico e o PDF alimentado depois.

## 4. Arquitetura-alvo

```text
src/
  domain/         entidades, value objects, regras puras (sem React, sem Supabase)
  application/    casos de uso, ports (interfaces de repositório), eventos de domínio
  infrastructure/
    supabase/     repositórios concretos (implementam os ports)
    mock/         repositórios fake (substituem o mock-mode atual)
    ai/           AIProvider abstrato + adaptadores intercambiáveis
    integration/  Integration Hub: connectors, workflows, auditoria
  interfaces/
    http/         /api/v1/* (API Gateway versionado)
    ui/           componentes por feature + Design System
```
Regra permanente: **UI → caso de uso → port → repositório**. Nenhum componente chama Supabase diretamente.

## 5. Plano Diretor

### Fase 0 — Fundação (sem mudança visível)
Camadas `domain/application/infrastructure`; ports + repositórios Supabase e Mock para escolas/turmas/alunos; convenção de migrations incrementais; ADR-001 (Clean Architecture) e ADR-002 (Integration Hub como única fronteira externa).
*Risco:* baixo. *Rollback:* código novo não referenciado; reverter commit.
*Aceite:* telas atuais idênticas, agora consumindo repositórios; testes verdes.

### Fase 1 — Core organizacional e RBAC
Hierarquia Secretaria→Subsecretaria→Regional→Distrito→Escola; expansão do cadastro de escolas (INEP, CNPJ, geo, gestores, modalidades, turnos, capacidade); RBAC com 15 perfis e escopo hierárquico via RLS; auditoria, soft delete e histórico.
*Dependência:* Fase 0. *Risco:* alto (RLS).
*Mitigação:* novas tabelas/colunas aditivas; políticas antigas mantidas até a validação; Root e `admin@ana.gov.br` blindados por teste automatizado.
*Aceite:* Root e superadmin com acesso total inalterado; cada perfil enxerga apenas seu escopo.

### Fase 2 — Integration Hub e API v1
Registry de conectores (REST/GraphQL/SOAP, SQL, LDAP/AD, CSV/XLSX/XML/JSON, SFTP) com contrato único; orquestrador de workflows (origem→transformação→validação→destino) com retry, backoff, DLQ e log em `logs_integracao`; `/api/v1/schools|students|teachers|classes|attendance|grades|pedagogical-council` autenticadas; `pulse.server` promovido a conector assinado; importador inteligente do PDF de escolas (extração, normalização, deduplicação, fila de inconsistências).
*Dependência:* Fases 0–1. *Risco:* médio. *Rollback:* conectores desativáveis por configuração; `v0` permanece no ar.
*Aceite:* importação do PDF com relatório de duplicidades; núcleo sem nenhum acesso direto a base externa.

### Fase 3 — Gestão pedagógica
Responsáveis, professores/servidores, disciplinas, matrículas, frequência, avaliações, boletins, planos de ensino, PEI, ocorrências, atendimentos, inclusão, reforço, busca ativa; **Conselho Pedagógico** completo (pauta, participantes, ata, anexos, plano de ação, prazos, indicadores, histórico).
*Dependência:* Fase 1. *Risco:* médio (volume). *Aceite:* ciclo ponta a ponta aluno→turma→conselho→plano de ação.

### Fase 4 — Camada de IA
`AIProvider` abstrato (chat, resumo, embeddings) com adaptadores intercambiáveis; casos de uso: resumo pedagógico, geração de ata, recomendações, plano de intervenção, previsão de evasão/reprovação, comparativos escola/turma/aluno. Toda saída de IA gravada com proveniência e revisão humana.
*Dependência:* Fase 3. *Risco:* médio (LGPD). *Mitigação:* minimização e pseudonimização de dados enviados ao modelo.
*Aceite:* trocar de provedor sem alterar caso de uso.

### Fase 5 — Analytics
Dashboards por perfil (Secretário, Diretor, Coordenador, Professor); indicadores de frequência, evasão, rendimento, IDEB, fluxo, busca ativa, inclusão, transporte, alimentação, conselho; materialized views + agregações incrementais.
*Dependência:* Fase 3. *Aceite:* painel executivo carregando em < 2s com dados agregados.

### Fase 6 — Segurança, UX e otimização
MFA, controle de sessões, rate limiting, criptografia de campos sensíveis, monitoramento; Design System unificado com dark mode, WCAG 2.2 e i18n (pt-BR base); shell responsivo desktop; documentação viva (diagramas de arquitetura e de banco, docs de API/módulos, changelog, ADRs).
*Aceite:* varredura de segurança sem findings críticos; auditoria de acessibilidade aprovada.

## 6. Estratégia de execução recomendada

Três blocos de implementação, um por vez, cada um encerrado com build, testes e documentação:
- **Bloco A:** Fases 0–2 (arquitetura, banco, RBAC, Integration Hub, API v1)
- **Bloco B:** Fases 3–4 (módulos pedagógicos e IA)
- **Bloco C:** Fases 5–6 (analytics, segurança, UX)

## 7. Detalhes técnicos

- Migrations sempre aditivas: `ADD COLUMN` / novas tabelas / novas policies; nada de `DROP` sem migração de dados verificada.
- Todo `CREATE TABLE` em `public` acompanha `GRANT` + `ENABLE ROW LEVEL SECURITY` + policies na mesma migration.
- Autorização exclusivamente por funções `SECURITY DEFINER` (padrão `has_role` / `has_scope`), nunca por papel gravado em `profiles`.
- Rotas protegidas permanecem sob `_authenticated/`; server functions sensíveis usam `requireSupabaseAuth`.
- Testes: unitários no domínio, integração nos repositórios, teste de regressão de permissões do Root em cada migration de RLS.

# SECURITY.md — Segurança Geral

## Superfície
App web (PWA mobile-first), banco Postgres com RLS, storage privado e rotas públicas
assinadas para integração.

## Práticas
- Segredos exclusivamente no servidor, lidos dentro dos handlers.
- Nenhum GRANT para `anon`; leitura pública apenas por rota assinada.
- Funções `security definer` com `search_path = public`.
- Logs de integração com status de assinatura, timestamp e nonce (anti-replay).
- Trilha de auditoria imutável para mudanças de escopo e papéis.
- Upload validado por tipo e tamanho; URLs assinadas de curta duração.

## Hardening recomendado
MFA para superadmin e secretaria, expiração de sessão reduzida para perfis
administrativos, rotação trimestral dos tokens de integração, revisão semestral
de papéis, alertas sobre `logs_integracao` com `signature_ok = false`.

## Ameaças e mitigação
| Ameaça | Mitigação |
| --- | --- |
| Escalada de privilégio | Papéis em tabela isolada + RLS + auditoria |
| Vazamento de dados de aluno | RLS por escopo, storage privado, sem PII em rotas públicas |
| Replay de requisição | Timestamp + nonce + HMAC |
| Abuso de upload | Limite de 20 MB, validação de MIME, escopo de escola |
| Exposição de segredo | Somente server functions; nunca em `import.meta.env` |

## Resposta a incidentes
1. Rotacionar tokens em Perfil → Integração. 2. Revisar `logs_integracao` e `audit_log`.
3. Revogar papéis afetados. 4. Comunicar o encarregado de dados (LGPD) em até 48h.

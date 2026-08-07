# Frameworks de Conformidade (GRC)

## Referências aplicáveis
- **LGPD (Lei 13.709/2018)** — dados de crianças e adolescentes exigem o melhor
  interesse do titular e consentimento específico do responsável.
- **ISO/IEC 27001 (A.5, A.8, A.9, A.12)** — política, controle de acesso, registro.
- **NIST CSF 2.0** — Identify, Protect, Detect, Respond, Recover.
- **CIS Controls v8** — inventário, controle de acesso, logs de auditoria.

## Como aplicar neste projeto
| Controle | Implementação |
| --- | --- |
| Minimização de dados | Somente campos pedagógicos necessários; sem CPF de aluno |
| Base legal | Execução de política pública de educação; termo de uso no cadastro |
| Controle de acesso | RBAC hierárquico + RLS por `has_school_access` |
| Rastreabilidade | `audit_log` (org_unit/roles) e `import_runs` exportáveis em CSV |
| Registro de integrações | `logs_integracao` com status de assinatura |
| Retenção | Materiais de aluno revisados por ano letivo |
| Resposta a incidentes | Ver `SECURITY.md` |

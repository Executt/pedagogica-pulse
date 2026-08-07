# Pontos de Função (APF)

Contagem estimada (IFPUG, não ajustada).

## Arquivos Lógicos Internos (ALI)
| ALI | Complexidade | PF |
| --- | --- | --- |
| Organização (org_units + schools) | Alta | 15 |
| Identidade/RBAC (profiles + user_roles) | Média | 10 |
| Turmas/Alunos | Média | 10 |
| Observações | Baixa | 7 |
| Materiais/Registros | Alta | 15 |
| Sugestões de IA | Média | 10 |
| Agenda + Comunicados | Baixa | 14 |
| Governança (audit_log + import_runs) | Média | 10 |
| Integração (config + logs) | Baixa | 7 |
| **Subtotal ALI** | | **98** |

## Arquivos de Interface Externa (AIE)
Sistema web Pulse (leitura de escolas/turmas/alunos) — Média: **7**.

## Entradas Externas (EE)
Login/cadastro, perfil, upload de material, criação de observação, evento, comunicado,
tratativa de sugestão, importação de PDF, ações em lote, rotação de token, reset de mocks
— 11 × 4 = **44**.

## Saídas Externas (SE)
Dashboard, indicadores de turma, ficha do aluno, diagnóstico da importação, comparação
PDF × base, exportação CSV, diagnóstico de integração — 7 × 5 = **35**.

## Consultas Externas (CE)
Listas de turmas, alunos, escolas, materiais, agenda, comunicados, curadoria, histórico
de importações, auditoria — 9 × 4 = **36**.

**Total PF não ajustado: 98 + 7 + 44 + 35 + 36 = 220 PF.**

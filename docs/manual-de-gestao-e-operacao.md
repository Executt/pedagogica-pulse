# Manual de Gestão e Operação

## Rotina diária
1. Abrir `/home` e conferir o selo de status da API no cabeçalho.
2. Em `/curadoria`, tratar sugestões pendentes (aplicar, agendar ou descartar).
3. Em `/registros`, confirmar que os materiais do dia estão com selo "sincronizado".
4. Superadmin: revisar `/admin/auditoria` (mudanças de escopo e papéis).

## Rotina semanal
- Exportar o CSV em `/admin/importacoes` e arquivar junto ao processo administrativo.
- Revisar `logs_integracao` em Perfil → Diagnóstico.
- Conferir alunos em risco alto por escola.

## Backup
Backups automáticos diários do banco pelo provedor. Exportações manuais:
CSV de importações (tela) e JSON de cenários mockados (Perfil → Modo demo).
Materiais residem no bucket `materials` e acompanham o backup do projeto.

## Troubleshooting
| Sintoma | Diagnóstico | Ação |
| --- | --- | --- |
| Selo "API off" | 3 falhas seguidas ativaram o circuit breaker | Aguardar 5 min ou "Testar conexão" |
| "Leitura indisponível" | 404 nas rotas de leitura do Pulse | Verificar `PULSE_API_URL` e publicar as rotas no sistema web |
| Registro com erro de sync | `sync_error` no material | Reenviar pelo card do registro |
| PDF sem escolas detectadas | PDF digitalizado (sem texto) | Usar PDF nativo ou OCR prévio |
| Tela vazia após login | Usuário sem papel atribuído | Superadmin atribui papel em `user_roles` |
| Assinatura inválida | Token rotacionado só de um lado | Rotacionar nos dois sistemas |

## Publicação
Validar em preview → publicar → conferir `/auth` e uma tela autenticada em produção.

# Regras de Negócio

## RN-01 Hierarquia
Uma unidade não pode ser pai de si mesma nem formar ciclo (trigger `org_units_no_cycle`).
A visibilidade de uma unidade inclui todos os descendentes.

## RN-02 Escopo de acesso
Usuário vê uma escola se: é superadmin, tem papel naquela escola, ou tem papel em
unidade ancestral da escola.

## RN-03 Papéis
Papéis residem exclusivamente em `user_roles`. Elevação de privilégio só por migration
ou superadmin; toda alteração é auditada.

## RN-04 Importação de escolas
- Bloqueia (erro): nome ausente/curto (<5), CNPJ com DV inválido, INEP duplicado.
- Alerta (aviso): INEP/CNPJ/endereço/unidade ausentes, capacidade fora de 10–5000,
  nome duplicado.
- Candidatos com erro nunca são enviados, mesmo se marcados.
- Correção manual revalida toda a lista (inclusive duplicidades).
- Ações em lote selecionam/desmarcam por tipo de inconsistência ou por hierarquia;
  a confirmação final registra as ações aplicadas.
- Comparação lado a lado exibe valor extraído × valor atual antes da atualização.
- Chave de correspondência: INEP; na ausência, nome normalizado.
- Toda execução grava `import_runs` com contagens e inconsistências.

## RN-05 Registros/materiais
Tamanho máximo 20 MB; tipos permitidos: imagem, áudio, vídeo curto e documento.
Duração é extraída automaticamente para mídia. O intervalo de tempo (`time_range_*`)
é obrigatório para compor o contexto do sistema. Sincronização registra
`synced_at` ou `sync_error`.

## RN-06 Risco do aluno
`low` regular, `medium` atenção, `high` risco alto — orienta a priorização da curadoria.

## RN-07 Integração
Requisição inválida (assinatura, timestamp ou nonce) é rejeitada e registrada.
Após 3 falhas consecutivas, o app entra em fallback de mock por 5 minutos.

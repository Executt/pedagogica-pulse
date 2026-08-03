# ADR-002 — Integration Hub como única fronteira externa

Data: 2026-08-03 · Status: Aceito

## Contexto
O sistema será a fonte oficial dos dados pedagógicos da rede municipal. Sistemas externos
não podem alterar diretamente o banco, e o núcleo não pode conhecer bancos de terceiros.

## Decisão
Toda comunicação com sistemas externos passa por um módulo independente, o **Integration Hub**
(`src/infrastructure/integration`), composto por:

- **Connectors** — contrato único por protocolo (REST, GraphQL, SOAP, SQL, LDAP/AD, arquivos, SFTP).
- **Workflows** — orquestração origem → transformação → validação → destino, com retry, backoff e DLQ.
- **Auditoria** — todo tráfego registrado em `logs_integracao`; credenciais em `configuracoes_integracao`.

O cliente assinado atual (`src/lib/pulse.server.ts`, HMAC-SHA256 com timestamp e nonce) é
promovido a primeiro conector e serve de referência de segurança para os demais.

## Consequências
- As rotas `/api/public/pulse/*` são congeladas como `v0` e permanecem no ar.
- Novas APIs nascem versionadas em `/api/v1/*`, autenticadas e autorizadas.
- Nenhum caso de uso do núcleo abre conexão direta com base externa.

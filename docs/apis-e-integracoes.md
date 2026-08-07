# APIs e Integrações

## Server functions (`createServerFn`)
- `src/lib/pulse-read.functions.ts` — `checkPulseConnection`, `fetchPulseResource`.
- `src/lib/pulse-sync.functions.ts` — envio automático de novos registros.
- `src/lib/pulse-admin.functions.ts` — leitura/rotação de token e diagnóstico.

## Rotas públicas
`src/routes/api/public/pulse/*` para o sistema web externo. Toda requisição é
verificada por HMAC-SHA256 (`timestamp` + `nonce` + corpo) e registrada em
`logs_integracao` com `signature_ok`, `status` e erro.

## PostgREST
Leitura/escrita direta do app pelas tabelas com RLS. Sem GRANT para `anon`.

## Realtime
Não habilitado por padrão. Atualização por refetch em segundo plano (3 min) e
circuit breaker em `src/lib/api-health.ts` (3 falhas → 5 min de fallback para mock).

## Storage
Bucket privado `materials`; caminho `{userId}/{schoolId}/{timestamp}-{uuid}.{ext}`;
URLs assinadas para leitura.

## Segredos
`PULSE_API_URL`, `PULSE_API_TOKEN`, `PULSE_INGEST_URL`, `PULSE_INGEST_TOKEN`,
`LOVABLE_API_KEY`. Lidos apenas dentro dos handlers, nunca no cliente.

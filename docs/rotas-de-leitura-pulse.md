# Rotas de leitura Pulse — pacote para o sistema Inteligência Pedagógica

Este arquivo contém o código pronto para colar **no outro projeto**
(`inteligenciapedagogica.lovable.app`). Neste app (Pedagógica Pulse) as sete
rotas já existem e respondem `401` sem assinatura — o `404` vem do sistema
remoto, que ainda não publicou as rotas.

## Esquema de autenticação (idêntico ao do ingest)

- `Authorization: Bearer <PULSE_API_TOKEN>`
- `x-pulse-timestamp` — epoch em ms (janela de 5 min)
- `x-pulse-nonce` — UUID
- `x-pulse-signature` — HMAC-SHA256 do token sobre `` `${ts}.${nonce}.${rawBody}` `` (hex).
  Em GET o corpo é string vazia.

## Resposta

```json
{ "ok": true, "resource": "escolas", "count": 12, "data": [ ... ] }
```

Erros: `{ "ok": false, "error": "invalid_signature" }` com 401/503/500.
Suporta `ETag` + `If-None-Match` (304) e os filtros
`?limit=&since=&school_id=&class_id=&student_id=`.

## 1. `src/lib/pulse.server.ts` (verificação)

```ts
export async function sign(token: string, ts: string, nonce: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${nonce}.${body}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPulseRequest(request: Request, rawBody = "") {
  const token = process.env["PULSE_API_TOKEN"] ?? "";
  if (!token) return { ok: false as const, status: 503, error: "integration_not_configured" };

  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer || !timingSafeEqual(bearer, token)) {
    return { ok: false as const, status: 401, error: "invalid_token" };
  }
  const ts = request.headers.get("x-pulse-timestamp");
  const nonce = request.headers.get("x-pulse-nonce");
  const signature = request.headers.get("x-pulse-signature");
  if (!ts || !nonce || !signature) return { ok: false as const, status: 401, error: "missing_signature_headers" };

  const skew = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(skew) || skew > 5 * 60_000) {
    return { ok: false as const, status: 401, error: "timestamp_out_of_window" };
  }
  const expected = await sign(token, ts, nonce, rawBody);
  if (!timingSafeEqual(signature.toLowerCase(), expected)) {
    return { ok: false as const, status: 401, error: "invalid_signature" };
  }
  return { ok: true as const };
}
```

## 2. `src/lib/pulse-serve.server.ts` (handler genérico)

Copiar o arquivo homônimo deste projeto. Ajustar apenas o mapa `SELECT`
para os nomes reais das tabelas do sistema remoto. Campos esperados pelo app:

| Recurso | Campos mínimos |
| --- | --- |
| escolas | `id, name, city` |
| turmas | `id, school_id, name, grade, year` |
| alunos | `id, class_id, school_id, full_name, risk, attendance_rate, has_pei, guardian_name, guardian_phone, birthdate` |
| registros | `id, school_id, class_id, student_id, name, mime_type, time_range_start, time_range_end, created_at` |
| observacoes | `id, student_id, type, content, created_at, author` |
| agenda | `id, school_id, class_id, title, starts_at, ends_at` |
| sugestoes | `id, class_id, student_id, type, title, description, status, created_at` |

`risk` deve ser `"low" | "medium" | "high"`; `attendance_rate` numérico (0–100).

## 3. Um arquivo por recurso em `src/routes/api/public/pulse/<recurso>.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pulse/escolas")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { servePulseResource } = await import("@/lib/pulse-serve.server");
        return servePulseResource("escolas", request);
      },
    },
  },
});
```

Repetir para `turmas`, `alunos`, `registros`, `observacoes`, `agenda`, `sugestoes`.

## 4. Teste rápido (bash)

```bash
TOKEN=pulse_...
TS=$(date +%s000); NONCE=$(uuidgen)
SIG=$(printf "%s.%s." "$TS" "$NONCE" | openssl dgst -sha256 -hmac "$TOKEN" -hex | awk '{print $2}')
curl -s "https://inteligenciapedagogica.lovable.app/api/public/pulse/escolas?limit=1" \
  -H "Authorization: Bearer $TOKEN" -H "x-pulse-timestamp: $TS" \
  -H "x-pulse-nonce: $NONCE" -H "x-pulse-signature: $SIG"
```

Assim que as rotas responderem `200`, o Pedagógica Pulse passa a espelhar o
sistema real sem nenhuma alteração de código aqui.

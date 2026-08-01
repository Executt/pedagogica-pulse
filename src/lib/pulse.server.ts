/**
 * Cliente/servidor HTTP assinado do protocolo "Pulse" — integração com o
 * sistema Inteligência Pedagógica (https://inteligenciapedagogica.lovable.app).
 *
 * Autenticação: Authorization: Bearer <token>
 * Assinatura:   HMAC-SHA256(token, `${timestamp}.${nonce}.${rawBody}`)
 *               em x-pulse-timestamp / x-pulse-nonce / x-pulse-signature
 */

const DEFAULT_BASE = "https://inteligenciapedagogica.lovable.app";

/** Token/base efetivos: tabela de configuração (superadmin) > secrets. */
export async function pulseConfigAsync(): Promise<{ token: string; base: string; source: "db" | "env" | "none" }> {
  const env = pulseConfig();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("configuracoes_integracao")
      .select("key, value")
      .in("key", ["PULSE_API_TOKEN", "PULSE_API_URL"]);
    const map = new Map((data ?? []).map((r) => [r.key, r.value]));
    const token = map.get("PULSE_API_TOKEN")?.trim();
    const base = normalizeBase(map.get("PULSE_API_URL")?.trim() || env.base);
    if (token) return { token, base, source: "db" };
    return { ...env, base, source: env.token ? "env" : "none" };
  } catch {
    return { ...env, source: env.token ? "env" : "none" };
  }
}

function normalizeBase(raw: string) {
  return raw.replace(/\/api\/public\/pulse\/.*$/, "").replace(/\/+$/, "") || DEFAULT_BASE;
}

export function pulseConfig() {
  const token = process.env["PULSE_API_TOKEN"] ?? process.env["PULSE_INGEST_TOKEN"] ?? "";
  const rawBase = process.env["PULSE_API_URL"] ?? process.env["PULSE_INGEST_URL"] ?? DEFAULT_BASE;
  return { token, base: normalizeBase(rawBase) };
}

export async function sign(token: string, ts: string, nonce: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${nonce}.${body}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Valida uma requisição recebida nas nossas rotas públicas do Pulse. */
export async function verifyPulseRequest(
  request: Request,
  rawBody = "",
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { token } = await pulseConfigAsync();
  if (!token) return { ok: false, status: 503, error: "integration_not_configured" };

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  if (!bearer || !timingSafeEqual(bearer, token)) {
    return { ok: false, status: 401, error: "invalid_token" };
  }

  const ts = request.headers.get("x-pulse-timestamp");
  const nonce = request.headers.get("x-pulse-nonce");
  const signature = request.headers.get("x-pulse-signature");
  if (!ts || !nonce || !signature) return { ok: false, status: 401, error: "missing_signature_headers" };

  const skew = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(skew) || skew > 5 * 60_000) {
    return { ok: false, status: 401, error: "timestamp_out_of_window" };
  }

  const expected = await sign(token, ts, nonce, rawBody);
  if (!timingSafeEqual(signature.toLowerCase(), expected)) {
    return { ok: false, status: 401, error: "invalid_signature" };
  }
  return { ok: true };
}

export type PulseResponse<T = unknown> = {
  ok: boolean;
  status: number;
  /** true quando a rota de leitura ainda não existe no sistema remoto (404) */
  unavailable?: boolean;
  data?: T;
  error?: string;
  /** diagnóstico */
  ts: string;
  nonce: string;
  signed: boolean;
  base: string;
};

export async function pulseFetch<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<PulseResponse<T>> {
  const { token, base } = await pulseConfigAsync();
  const ts = String(Date.now());
  const nonce = crypto.randomUUID();
  if (!token) {
    return { ok: false, status: 0, error: "missing_config", ts, nonce, signed: false, base };
  }

  const method = init.method ?? "GET";
  const raw = init.body === undefined ? "" : JSON.stringify(init.body);

  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "x-pulse-timestamp": ts,
        "x-pulse-nonce": nonce,
        "x-pulse-signature": await sign(token, ts, nonce, raw),
      },
      ...(method === "POST" ? { body: raw } : {}),
    });

    const text = await res.text();
    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* rota inexistente costuma devolver HTML */
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        unavailable: res.status === 404,
        error: text.slice(0, 300) || `HTTP ${res.status}`,
        ts,
        nonce,
        signed: true,
        base,
      };
    }
    return { ok: true, status: res.status, data: parsed as T, ts, nonce, signed: true, base };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "network_error",
      ts,
      nonce,
      signed: true,
      base,
    };
  }
}

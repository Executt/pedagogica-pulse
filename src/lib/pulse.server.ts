/**
 * Cliente HTTP assinado para o sistema "Inteligência Pedagógica"
 * (https://inteligenciapedagogica.lovable.app).
 *
 * Autenticação: Authorization: Bearer <token>
 * Assinatura:  HMAC-SHA256(token, `${timestamp}.${nonce}.${rawBody}`)
 *              enviada em x-pulse-timestamp / x-pulse-nonce / x-pulse-signature
 */

const DEFAULT_BASE = "https://inteligenciapedagogica.lovable.app";

export function pulseConfig() {
  const token = process.env["PULSE_API_TOKEN"] ?? process.env["PULSE_INGEST_TOKEN"] ?? "";
  const rawBase = process.env["PULSE_API_URL"] ?? process.env["PULSE_INGEST_URL"] ?? DEFAULT_BASE;
  // PULSE_INGEST_URL pode apontar direto para o endpoint de ingest
  const base = rawBase.replace(/\/api\/public\/pulse\/.*$/, "").replace(/\/+$/, "");
  return { token, base: base || DEFAULT_BASE };
}

async function sign(token: string, ts: string, nonce: string, body: string) {
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

export type PulseResponse<T = unknown> = {
  ok: boolean;
  status: number;
  /** true quando a rota ainda não existe no sistema remoto (404) */
  unavailable?: boolean;
  data?: T;
  error?: string;
};

export async function pulseFetch<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<PulseResponse<T>> {
  const { token, base } = pulseConfig();
  if (!token) return { ok: false, status: 0, error: "missing_config" };

  const method = init.method ?? "GET";
  const raw = init.body === undefined ? "" : JSON.stringify(init.body);
  const ts = String(Date.now());
  const nonce = crypto.randomUUID();

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
      /* rota inexistente devolve HTML */
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        unavailable: res.status === 404,
        error: typeof parsed === "object" ? text.slice(0, 300) : `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, data: parsed as T };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network_error" };
  }
}

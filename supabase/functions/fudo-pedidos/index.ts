// Edge Function de Supabase: proxy hacia la API de Fudo.
//
// El navegador llama a esta función. Acá están el apiKey y el apiSecret,
// leídos de los secrets de Supabase. No se devuelven, no se loguean y no
// viven en el repo.
//
// Si Fudo no responde (timeout, red, HTTP no ok o JSON inválido) devolvemos
// 503 { error: "fudo_no_disponible", paso, tipo, desde }. El texto crudo de
// Fudo no se reenvía. Un error inesperado nuestro es 500 { error: "error_interno" }.
//
// FUDO_AUTH_URL y FUDO_BASE_URL solo existen para los tests locales. En
// producción no se setean: se usan los hosts reales de Fudo.

const FUDO_AUTH_URL_DEFAULT = "https://auth.fu.do/api";
const FUDO_BASE_URL_DEFAULT = "https://api.fu.do/v1alpha1";
const TIMEOUT_LOGIN_MS = 5_000;
const TIMEOUT_VENTAS_MS = 10_000;
export const VENTANA_LOG_MS = 60_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Paso = "login" | "ventas" | "parseo";
type Tipo = "timeout" | "red" | "http" | "json";

class FudoFallo extends Error {
  paso: Paso;
  tipo: Tipo;
  status?: number;
  ms: number;

  constructor(info: {
    paso: Paso;
    tipo: Tipo;
    status?: number;
    ms: number;
    mensaje: string;
  }) {
    super(info.mensaje);
    this.name = "FudoFallo";
    this.paso = info.paso;
    this.tipo = info.tipo;
    this.status = info.status;
    this.ms = info.ms;
  }
}

let cachedToken: { token: string; exp: number } | null = null;
let rachaDesde: string | null = null;
let ultimoLogMs = 0;
let suprimidos = 0;
let ahora = (): number => Date.now();

export function urlsFudo(): { auth: string; base: string } {
  return {
    auth: Deno.env.get("FUDO_AUTH_URL") || FUDO_AUTH_URL_DEFAULT,
    base: Deno.env.get("FUDO_BASE_URL") || FUDO_BASE_URL_DEFAULT,
  };
}

export function tokenEnCache(): string | null {
  return cachedToken?.token ?? null;
}

/** Solo para `deno test`. No lo llama el camino HTTP. */
export function resetEstadoParaPruebas(): void {
  cachedToken = null;
  rachaDesde = null;
  ultimoLogMs = 0;
  suprimidos = 0;
  ahora = () => Date.now();
}

/** Deja el token vencido para forzar un login en el próximo pedido. */
export function expirarTokenParaPruebas(): void {
  if (cachedToken) cachedToken.exp = 0;
}

/** Reloj del límite de un log por minuto. El timeout de red usa el reloj real. */
export function fijarRelojParaPruebas(fn: () => number): void {
  ahora = fn;
}

function sanitizar(mensaje: string): string {
  let out = mensaje.replace(/[\r\n]+/g, " ").trim();
  const secretos = [
    Deno.env.get("FUDO_API_KEY") ?? "",
    Deno.env.get("FUDO_API_SECRET") ?? "",
    cachedToken?.token ?? "",
  ];
  for (const secreto of secretos) {
    if (secreto.length < 4) continue;
    out = out.split(secreto).join("[redactado]");
  }
  return out.replace(/Bearer\s+\S+/gi, "Bearer [redactado]");
}

function logError(info: {
  paso: Paso;
  tipo?: Tipo;
  status?: number;
  ms: number;
  mensaje: string;
}): void {
  const t = ahora();
  if (ultimoLogMs !== 0 && t - ultimoLogMs < VENTANA_LOG_MS) {
    suprimidos++;
    return;
  }
  const linea: Record<string, string | number> = {
    paso: info.paso,
    ms: info.ms,
    mensaje: sanitizar(info.mensaje).slice(0, 150),
  };
  if (info.tipo) linea.tipo = info.tipo;
  if (typeof info.status === "number") linea.status = info.status;
  if (suprimidos > 0) {
    linea.suprimidos = suprimidos;
    suprimidos = 0;
  }
  ultimoLogMs = t;
  console.error(JSON.stringify(linea));
}

function esAbort(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("name" in err)) return false;
  const name = String((err as { name: unknown }).name);
  return name === "AbortError" || name === "TimeoutError";
}

async function descartarCuerpo(res: Response): Promise<void> {
  try {
    await res.body?.cancel();
  } catch {
    // El cuerpo no se loguea ni se reenvía al navegador.
  }
}

async function fetchConPlazo(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  paso: Paso,
): Promise<Response> {
  const inicio = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    const ms = Date.now() - inicio;
    if (esAbort(err)) {
      throw new FudoFallo({
        paso,
        tipo: "timeout",
        ms,
        mensaje: "tiempo de espera agotado",
      });
    }
    const crudo = err instanceof Error ? err.message : "error de red";
    throw new FudoFallo({
      paso,
      tipo: "red",
      ms,
      mensaje: sanitizar(crudo),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getFudoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return cachedToken.token;
  }
  const apiKey = Deno.env.get("FUDO_API_KEY");
  const apiSecret = Deno.env.get("FUDO_API_SECRET");
  const inicio = Date.now();
  let res: Response;
  try {
    res = await fetchConPlazo(urlsFudo().auth, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ apiKey, apiSecret }),
    }, TIMEOUT_LOGIN_MS, "login");
  } catch (err) {
    cachedToken = null;
    throw err;
  }
  if (!res.ok) {
    await descartarCuerpo(res);
    cachedToken = null;
    throw new FudoFallo({
      paso: "login",
      tipo: "http",
      status: res.status,
      ms: Date.now() - inicio,
      mensaje: `No se pudo autenticar contra Fudo: ${res.status}`,
    });
  }
  try {
    const data = await res.json();
    cachedToken = { token: data.token, exp: data.exp };
    return data.token;
  } catch (err) {
    cachedToken = null;
    if (err instanceof SyntaxError) {
      throw new FudoFallo({
        paso: "login",
        tipo: "json",
        status: res.status,
        ms: Date.now() - inicio,
        mensaje: "respuesta de login no es JSON válido",
      });
    }
    throw err;
  }
}

function queryVentas(): URLSearchParams {
  // Mismo patrón que v11, el que ya coincidía con requests de Python.
  const params = new URLSearchParams();
  params.set("filter[saleType]", "eq.TAKEAWAY");
  params.set("filter[saleState]", "in.(PENDING,IN-COURSE,READY-TO-DELIVER,CLOSED)");
  params.set("fields[sale]", "saleState,customerName,total,createdAt,items");
  params.set("include", "items.product");
  params.set("sort", "-createdAt");
  params.set("page[size]", "25");
  return params;
}

async function pedirVentas(token: string, reintento = false): Promise<unknown> {
  const inicio = Date.now();
  const res = await fetchConPlazo(
    `${urlsFudo().base}/sales?${queryVentas().toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    TIMEOUT_VENTAS_MS,
    "ventas",
  );

  if (res.status === 401) {
    await descartarCuerpo(res);
    cachedToken = null;
    if (!reintento) {
      const nuevo = await getFudoToken();
      return await pedirVentas(nuevo, true);
    }
    throw new FudoFallo({
      paso: "ventas",
      tipo: "http",
      status: 401,
      ms: Date.now() - inicio,
      mensaje: "Fudo respondió 401",
    });
  }

  if (!res.ok) {
    await descartarCuerpo(res);
    throw new FudoFallo({
      paso: "ventas",
      tipo: "http",
      status: res.status,
      ms: Date.now() - inicio,
      mensaje: `Fudo respondió ${res.status}`,
    });
  }

  try {
    return await res.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new FudoFallo({
        paso: "ventas",
        tipo: "json",
        status: res.status,
        ms: Date.now() - inicio,
        mensaje: "respuesta de ventas no es JSON válido",
      });
    }
    throw err;
  }
}

type FudoNodo = {
  id?: string;
  type?: string;
  attributes?: {
    quantity?: number | string | null;
    name?: string | null;
    saleState?: unknown;
    customerName?: unknown;
    total?: unknown;
    createdAt?: unknown;
  };
  relationships?: {
    items?: { data?: Array<{ id?: string }> };
    product?: { data?: { id?: string } | null };
  };
};

function armarPedidos(data: unknown): Array<{
  fudo_sale_id: string | undefined;
  estado_fudo: unknown;
  cliente: unknown;
  total: unknown;
  creado: unknown;
  detalle: string;
}> {
  const body = data as { included?: FudoNodo[]; data?: FudoNodo[] };
  const included = body.included || [];
  const productsById: Record<string, FudoNodo> = {};
  const itemsById: Record<string, FudoNodo> = {};
  for (const inc of included) {
    const id = inc.id as string;
    if (inc.type === "Product") productsById[id] = inc;
    if (inc.type === "Item") itemsById[id] = inc;
  }

  function buildDetalle(sale: FudoNodo): string {
    try {
      const itemRefs = sale.relationships?.items?.data || [];
      const partes: string[] = [];
      for (const ref of itemRefs) {
        const item = itemsById[ref.id as string];
        if (!item) continue;
        const qty = item.attributes?.quantity || 1;
        const productRef = item.relationships?.product?.data;
        const product = productRef ? productsById[productRef.id as string] : null;
        const nombre = product?.attributes?.name || "Item";
        partes.push(`${qty}x ${nombre}`);
      }
      return partes.length ? partes.join(", ") : "Pedido de Mostrador";
    } catch (_e) {
      return "Pedido de Mostrador";
    }
  }

  return (body.data || []).map((s) => {
    const attrs = s.attributes as {
      saleState: unknown;
      customerName: unknown;
      total: unknown;
      createdAt: unknown;
    };
    return {
      fudo_sale_id: s.id,
      estado_fudo: attrs.saleState,
      cliente: attrs.customerName,
      total: attrs.total,
      creado: attrs.createdAt,
      detalle: buildDetalle(s),
    };
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  let etapa: Paso = "login";
  const inicio = Date.now();
  try {
    const token = await getFudoToken();
    etapa = "ventas";
    const data = await pedirVentas(token);
    etapa = "parseo";
    const pedidos = armarPedidos(data);
    rachaDesde = null;
    return json({ pedidos });
  } catch (err) {
    if (err instanceof FudoFallo) {
      logError({
        paso: err.paso,
        tipo: err.tipo,
        status: err.status,
        ms: err.ms,
        mensaje: err.message,
      });
      if (!rachaDesde) rachaDesde = new Date().toISOString();
      return json({
        error: "fudo_no_disponible",
        paso: err.paso,
        tipo: err.tipo,
        desde: rachaDesde,
      }, 503);
    }
    const mensaje = err instanceof Error ? err.message : "error inesperado";
    logError({ paso: etapa, ms: Date.now() - inicio, mensaje });
    return json({ error: "error_interno" }, 500);
  }
}

Deno.serve(handleRequest);

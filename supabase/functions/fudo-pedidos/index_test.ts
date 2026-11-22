// Tests locales contra un Fudo falso. No llama a auth.fu.do ni a api.fu.do.
//
// deno test --allow-env --allow-net supabase/functions/fudo-pedidos/index_test.ts

// deno-lint-ignore no-import-prefix
import { assert, assertEquals } from "jsr:@std/assert@1";

const API_KEY = "prueba-fudo-api-key";
const API_SECRET = "prueba-fudo-api-secret";
const TOKEN = "token-fudo-prueba";

const serveReal = Deno.serve;
Deno.serve = ((_handler?: unknown) => undefined) as unknown as typeof Deno.serve;

const {
  handleRequest,
  resetEstadoParaPruebas,
  tokenEnCache,
  expirarTokenParaPruebas,
  fijarRelojParaPruebas,
  urlsFudo,
  VENTANA_LOG_MS,
} = await import("./index.ts");

Deno.serve = serveReal;

const logs: string[] = [];
console.error = (...args: unknown[]) => {
  logs.push(args.map((a) => String(a)).join(" "));
};

type Modo =
  | "ok"
  | "ventas503"
  | "lento"
  | "loginLento"
  | "login401"
  | "json"
  | "venta401unaVez"
  | "parseo";

type Control = {
  modo: Modo;
  logins: number;
  ventas: number;
  ventasQuery: string;
  loginConClave: boolean;
  ventasConBearer: number;
};

function queryV11(): string {
  const params = new URLSearchParams();
  params.set("filter[saleType]", "eq.TAKEAWAY");
  params.set("filter[saleState]", "in.(PENDING,IN-COURSE,READY-TO-DELIVER,CLOSED)");
  params.set("fields[sale]", "saleState,customerName,total,createdAt,items");
  params.set("include", "items.product");
  params.set("sort", "-createdAt");
  params.set("page[size]", "25");
  return params.toString();
}

function ventaOk() {
  return {
    data: [
      {
        id: "57",
        attributes: {
          saleState: "PENDING",
          customerName: "Ana",
          total: 16800,
          createdAt: "2026-11-21T15:00:00Z",
        },
        relationships: {
          items: { data: [{ type: "Item", id: "i1" }] },
        },
      },
      {
        id: "58",
        attributes: {
          saleState: "READY-TO-DELIVER",
          customerName: null,
          total: 0,
          createdAt: "2026-11-21T15:05:00Z",
        },
      },
    ],
    included: [
      {
        id: "i1",
        type: "Item",
        attributes: { quantity: 2 },
        relationships: { product: { data: { type: "Product", id: "p1" } } },
      },
      {
        id: "p1",
        type: "Product",
        attributes: { name: "LEN IT Burger" },
      },
    ],
  };
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    if (signal.aborted) done();
    else signal.addEventListener("abort", done);
  });
}

function revisar(texto: string): void {
  if (texto.includes(API_KEY) || texto.includes(API_SECRET)) {
    throw new Error("la salida contiene un secreto de prueba");
  }
}

async function leer(res: Response): Promise<{ status: number; texto: string; json: Record<string, unknown> | null }> {
  const texto = await res.text();
  revisar(texto);
  const headers = [...res.headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
  revisar(headers);
  try {
    return { status: res.status, texto, json: JSON.parse(texto) };
  } catch {
    return { status: res.status, texto, json: null };
  }
}

function revisarLogs(): void {
  for (const linea of logs) {
    revisar(linea);
    if (linea.includes(TOKEN) || /Bearer\s+\S+/i.test(linea)) {
      throw new Error("el log contiene el token de prueba o un header Authorization");
    }
    const obj = JSON.parse(linea) as { mensaje?: string };
    if (typeof obj.mensaje !== "string" || obj.mensaje.length > 150) {
      throw new Error("el mensaje del log no está truncado a 150 caracteres");
    }
    assert(!("apiKey" in (JSON.parse(linea) as Record<string, unknown>)));
    assert(!("apiSecret" in (JSON.parse(linea) as Record<string, unknown>)));
    assert(!("headers" in (JSON.parse(linea) as Record<string, unknown>)));
    assert(!("token" in (JSON.parse(linea) as Record<string, unknown>)));
  }
}

function fudoFalso(control: Control): { authUrl: string; baseUrl: string; cerrar: () => Promise<void> } {
  let ventas401 = 1;
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    onListen() {},
  }, async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/api") {
      control.logins++;
      const body = await req.json();
      control.loginConClave = body?.apiKey === API_KEY && body?.apiSecret === API_SECRET;
      if (control.modo === "login401") {
        return new Response(JSON.stringify({
          error: "no",
          eco: API_KEY,
          secreto: API_SECRET,
        }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      if (control.modo === "loginLento") {
        await esperar(20_000, req.signal);
        return new Response("tarde", { status: 200 });
      }
      const exp = Math.floor(Date.now() / 1000) + 3600;
      return Response.json({ token: TOKEN, exp });
    }
    if (url.pathname === "/v1alpha1/sales") {
      control.ventas++;
      control.ventasQuery = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      const auth = req.headers.get("authorization") ?? "";
      if (auth === `Bearer ${TOKEN}`) control.ventasConBearer++;
      if (control.modo === "ventas503") {
        return new Response(`cuerpo-crudo ${API_KEY} ${API_SECRET}`, { status: 503 });
      }
      if (control.modo === "lento") {
        await esperar(20_000, req.signal);
        return new Response("tarde", { status: 200 });
      }
      if (control.modo === "json") {
        return new Response("no-es-json{", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (control.modo === "venta401unaVez" && ventas401 > 0) {
        ventas401--;
        return new Response(`no-autorizado ${API_KEY} ${API_SECRET}`, { status: 401 });
      }
      if (control.modo === "parseo") {
        return Response.json({ data: [{ id: "99" }] });
      }
      return Response.json(ventaOk());
    }
    return new Response("ruta inesperada", { status: 500 });
  });

  const addr = server.addr as Deno.NetAddr;
  const base = `http://127.0.0.1:${addr.port}`;
  return {
    authUrl: `${base}/api`,
    baseUrl: `${base}/v1alpha1`,
    cerrar: () => server.shutdown(),
  };
}

function controlDe(modo: Modo): Control {
  return {
    modo,
    logins: 0,
    ventas: 0,
    ventasQuery: "",
    loginConClave: false,
    ventasConBearer: 0,
  };
}

function preparar(): void {
  resetEstadoParaPruebas();
  logs.length = 0;
  Deno.env.set("FUDO_API_KEY", API_KEY);
  Deno.env.set("FUDO_API_SECRET", API_SECRET);
}

async function pedir(): Promise<Response> {
  return await handleRequest(new Request("http://pantalla.local/fudo-pedidos"));
}

Deno.test("sin env de URL usa los hosts reales de Fudo", () => {
  const auth = Deno.env.get("FUDO_AUTH_URL");
  const base = Deno.env.get("FUDO_BASE_URL");
  Deno.env.delete("FUDO_AUTH_URL");
  Deno.env.delete("FUDO_BASE_URL");
  try {
    assertEquals(urlsFudo().auth, "https://auth.fu.do/api");
    assertEquals(urlsFudo().base, "https://api.fu.do/v1alpha1");
  } finally {
    if (auth !== undefined) Deno.env.set("FUDO_AUTH_URL", auth);
    if (base !== undefined) Deno.env.set("FUDO_BASE_URL", base);
  }
});

Deno.test("Fudo responde bien: 200 con pedidos y la query de v11", async () => {
  preparar();
  const control = controlDe("ok");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const preflight = await handleRequest(new Request("http://pantalla.local/", { method: "OPTIONS" }));
    assertEquals(preflight.status, 200);
    assertEquals(await preflight.text(), "ok");
    assertEquals(preflight.headers.get("access-control-allow-origin"), "*");
    assertEquals(
      preflight.headers.get("access-control-allow-headers"),
      "authorization, x-client-info, apikey, content-type",
    );

    const res = await leer(await pedir());
    assertEquals(res.status, 200);
    assertEquals(res.json, {
      pedidos: [
        {
          fudo_sale_id: "57",
          estado_fudo: "PENDING",
          cliente: "Ana",
          total: 16800,
          creado: "2026-11-21T15:00:00Z",
          detalle: "2x LEN IT Burger",
        },
        {
          fudo_sale_id: "58",
          estado_fudo: "READY-TO-DELIVER",
          cliente: null,
          total: 0,
          creado: "2026-11-21T15:05:00Z",
          detalle: "Pedido de Mostrador",
        },
      ],
    });
    assertEquals(control.ventasQuery, queryV11());
    assertEquals(control.loginConClave, true);
    assertEquals(control.ventasConBearer, 1);
    assertEquals(tokenEnCache(), TOKEN);
    assertEquals(logs.length, 0);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("ventas 503: fudo_no_disponible paso ventas tipo http, sin el cuerpo", async () => {
  preparar();
  const control = controlDe("ventas503");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const primera = await leer(await pedir());
    const segunda = await leer(await pedir());
    assertEquals(primera.status, 503);
    assertEquals(primera.json?.error, "fudo_no_disponible");
    assertEquals(primera.json?.paso, "ventas");
    assertEquals(primera.json?.tipo, "http");
    assertEquals(typeof primera.json?.desde, "string");
    assert(!Number.isNaN(Date.parse(String(primera.json?.desde))));
    assertEquals(segunda.json?.desde, primera.json?.desde);
    assertEquals(primera.texto.includes("cuerpo-crudo"), false);
    assertEquals(primera.texto.includes("detail"), false);
    assertEquals(logs.length, 1);
    const log = JSON.parse(logs[0]) as { paso: string; tipo: string; status: number };
    assertEquals(log.paso, "ventas");
    assertEquals(log.tipo, "http");
    assertEquals(log.status, 503);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("ventas que tarda 20s responde en unos 10s con tipo timeout", async () => {
  preparar();
  const control = controlDe("lento");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const inicio = Date.now();
    const res = await leer(await pedir());
    const elapsed = Date.now() - inicio;
    assertEquals(res.status, 503);
    assertEquals(res.json?.error, "fudo_no_disponible");
    assertEquals(res.json?.paso, "ventas");
    assertEquals(res.json?.tipo, "timeout");
    assert(elapsed >= 9_000 && elapsed < 16_000, `la respuesta tardó ${elapsed} ms`);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("login 401: 503 paso login y el token queda invalidado", async () => {
  preparar();
  const control = controlDe("ok");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const ok = await leer(await pedir());
    assertEquals(ok.status, 200);
    assertEquals(tokenEnCache(), TOKEN);
    expirarTokenParaPruebas();
    control.modo = "login401";
    const res = await leer(await pedir());
    assertEquals(res.status, 503);
    assertEquals(res.json?.error, "fudo_no_disponible");
    assertEquals(res.json?.paso, "login");
    assertEquals(res.json?.tipo, "http");
    assertEquals(tokenEnCache(), null);
    assertEquals(res.texto.includes("detail"), false);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("JSON inválido de ventas: 503 tipo json", async () => {
  preparar();
  const control = controlDe("json");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const res = await leer(await pedir());
    assertEquals(res.status, 503);
    assertEquals(res.json?.error, "fudo_no_disponible");
    assertEquals(res.json?.paso, "ventas");
    assertEquals(res.json?.tipo, "json");
    assertEquals(res.texto.includes("no-es-json"), false);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("ningún log ni respuesta contiene la clave de prueba", async () => {
  preparar();
  const control = controlDe("ventas503");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const res = await leer(await pedir());
    assertEquals(res.status, 503);
    revisar(res.texto);
    revisar(logs.join("\n"));
    assert(logs.length >= 1);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("login que tarda 20s corta a los 5s e invalida el token", async () => {
  preparar();
  const control = controlDe("ok");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    assertEquals((await leer(await pedir())).status, 200);
    expirarTokenParaPruebas();
    control.modo = "loginLento";
    const inicio = Date.now();
    const res = await leer(await pedir());
    const elapsed = Date.now() - inicio;
    assertEquals(res.json?.paso, "login");
    assertEquals(res.json?.tipo, "timeout");
    assertEquals(tokenEnCache(), null);
    assert(elapsed >= 4_500 && elapsed < 9_000, `el login tardó ${elapsed} ms`);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("ventas 401 invalida el token y reintenta una sola vez", async () => {
  preparar();
  const control = controlDe("ok");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    assertEquals((await leer(await pedir())).status, 200);
    assertEquals(control.logins, 1);
    control.modo = "venta401unaVez";
    const res = await leer(await pedir());
    assertEquals(res.status, 200);
    assertEquals(control.logins, 2);
    assertEquals(control.ventas, 3);
    assertEquals(res.texto.includes("no-autorizado"), false);
    assertEquals(logs.length, 0);
    assertEquals(tokenEnCache(), TOKEN);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("error de red en el login: 503 tipo red y sin token", async () => {
  preparar();
  Deno.env.set("FUDO_AUTH_URL", "http://127.0.0.1:9/api");
  Deno.env.set("FUDO_BASE_URL", "http://127.0.0.1:9/v1alpha1");
  const res = await leer(await pedir());
  assertEquals(res.status, 503);
  assertEquals(res.json?.paso, "login");
  assertEquals(res.json?.tipo, "red");
  assertEquals(tokenEnCache(), null);
  revisarLogs();
});

Deno.test("JSON de ventas imposible de mapear: 500 error_interno, sin el texto del throw", async () => {
  preparar();
  const control = controlDe("parseo");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const res = await leer(await pedir());
    assertEquals(res.status, 500);
    assertEquals(res.json, { error: "error_interno" });
    assertEquals(logs.length, 1);
    const log = JSON.parse(logs[0]) as { paso: string };
    assertEquals(log.paso, "parseo");
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("un log de error por minuto e informa cuántos se suprimieron", async () => {
  preparar();
  const control = controlDe("ventas503");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  let t = 1_700_000_000_000;
  fijarRelojParaPruebas(() => t);
  try {
    await pedir();
    assertEquals(logs.length, 1);
    t += 1_000;
    await pedir();
    t += 1_000;
    await pedir();
    assertEquals(logs.length, 1);
    t += VENTANA_LOG_MS - 2_000;
    await pedir();
    assertEquals(logs.length, 2);
    const segundo = JSON.parse(logs[1]) as { suprimidos?: number; paso: string; tipo: string };
    assertEquals(segundo.suprimidos, 2);
    assertEquals(segundo.paso, "ventas");
    assertEquals(segundo.tipo, "http");
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

Deno.test("una respuesta 200 corta la racha y el fallo siguiente tiene otro desde", async () => {
  preparar();
  const control = controlDe("ventas503");
  const fudo = await fudoFalso(control);
  Deno.env.set("FUDO_AUTH_URL", fudo.authUrl);
  Deno.env.set("FUDO_BASE_URL", fudo.baseUrl);
  try {
    const fallo = await leer(await pedir());
    control.modo = "ok";
    assertEquals((await leer(await pedir())).status, 200);
    await new Promise((r) => setTimeout(r, 5));
    control.modo = "ventas503";
    const otro = await leer(await pedir());
    assertEquals(otro.status, 503);
    assert(otro.json?.desde !== fallo.json?.desde);
  } finally {
    await fudo.cerrar();
    revisarLogs();
  }
});

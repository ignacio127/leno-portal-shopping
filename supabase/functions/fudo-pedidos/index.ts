// Edge Function de Supabase: proxy seguro hacia la API de Fudo.
//
// El navegador del cliente llama a ESTA funcion (que vive en los servidores
// de Supabase). Esta funcion es la unica que conoce el apiKey/apiSecret de
// Fudo -- nunca se exponen al navegador ni al repo de GitHub.
//
// Como desplegar (con la CLI de Supabase, se instala una sola vez):
//   npm install -g supabase
//   supabase login
//   supabase link --project-ref TU_PROJECT_REF
//   supabase functions deploy fudo-pedidos --no-verify-jwt
//   supabase secrets set FUDO_API_KEY=tu_api_key FUDO_API_SECRET=tu_api_secret
//
// Una vez desplegada, queda disponible en:
//   https://TU_PROJECT_REF.supabase.co/functions/v1/fudo-pedidos

const FUDO_AUTH_URL = "https://auth.fu.do/api";
const FUDO_BASE_URL = "https://api.fu.do/v1alpha1";

let cachedToken: { token: string; exp: number } | null = null;

async function getFudoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return cachedToken.token;
  }
  const apiKey = Deno.env.get("FUDO_API_KEY");
  const apiSecret = Deno.env.get("FUDO_API_SECRET");
  const res = await fetch(FUDO_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ apiKey, apiSecret }),
  });
  if (!res.ok) throw new Error(`No se pudo autenticar contra Fudo: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.token, exp: data.exp };
  return data.token;
}

Deno.serve(async (req) => {
  // CORS: permite que la pantalla (GitHub Pages) llame a esta funcion.
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
  const token = await getFudoToken();


    // Mismo patron de query que ya confirmamos funcionando con el script de
    // Python: usamos URLSearchParams para que corchetes, comas y parentesis
    // queden codificados igual que hace la libreria requests en Python.
    const params = new URLSearchParams();
    params.set("filter[saleType]", "eq.TAKEAWAY");
    params.set("filter[saleState]", "in.(PENDING,IN-COURSE,READY-TO-DELIVER,CLOSED)");
    params.set("fields[sale]", "saleState,customerName,total,createdAt,items");
    params.set("include", "items.product");
    params.set("sort", "-createdAt");
    params.set("page[size]", "25");

    const fudoRes = await fetch(`${FUDO_BASE_URL}/sales?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!fudoRes.ok) {
      const text = await fudoRes.text();
      return new Response(JSON.stringify({ error: "Fudo respondio con error", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await fudoRes.json();
    const included: any[] = data.included || [];

    // Mapas para resolver las relaciones venta -> item -> producto.
    // Es la parte NUEVA y sin probar en vivo todavia -- por eso todo el
    // parseo esta blindado con try/catch y cae a un texto generico si
    // la estructura real no coincide con lo esperado, sin romper nada.
    const productsById: Record<string, any> = {};
    const itemsById: Record<string, any> = {};
    for (const inc of included) {
      if (inc.type === "Product") productsById[inc.id] = inc;
      if (inc.type === "Item") itemsById[inc.id] = inc;
    }

    function buildDetalle(sale: any): string {
      try {
        const itemRefs = sale.relationships?.items?.data || [];
        const partes: string[] = [];
        for (const ref of itemRefs) {
          const item = itemsById[ref.id];
          if (!item) continue;
          const qty = item.attributes?.quantity || 1;
          const productRef = item.relationships?.product?.data;
          const product = productRef ? productsById[productRef.id] : null;
          const nombre = product?.attributes?.name || "Item";
          partes.push(`${qty}x ${nombre}`);
        }
        return partes.length ? partes.join(", ") : "Pedido de Mostrador";
      } catch (_e) {
        return "Pedido de Mostrador";
      }
    }

    // Devolvemos solo lo que la pantalla necesita, nunca el token ni nada crudo.
    const pedidos = (data.data || []).map((s: any) => ({
      fudo_sale_id: s.id,
      estado_fudo: s.attributes.saleState,
      cliente: s.attributes.customerName,
      total: s.attributes.total,
      creado: s.attributes.createdAt,
      detalle: buildDetalle(s),
    }));

    return new Response(JSON.stringify({ pedidos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

# LENO Portal Shopping — Pantalla de Retiro

Pantalla de retiro para clientes + panel de control para el local, para la sucursal de LENO en Portal Shopping.

## Qué es esto

- `index.html`: la app completa (pantalla de retiro + panel de control), en un solo archivo.
- Los datos viven en una base de datos real (Supabase) y se sincronizan **en tiempo real** entre cualquier dispositivo que tenga esta página abierta — no hace falta que sea el mismo navegador ni el mismo dispositivo.

## Cómo se usa

- **Pantalla de Retiro**: se abre por defecto — turnos listos, en preparación, y el panel de publicidad rotando.
- **Panel de Control**: ícono de engranaje abajo a la izquierda. Ahí se agregan pedidos, se marcan como listos/retirados, y se carga o desactiva contenido de publicidad (con imagen, subiendo un archivo o pegando un link de Google Drive).

## Arquitectura (para quien toque este código después)

- **Frontend**: HTML/CSS/JS plano, sin build step, pensado para GitHub Pages.
- **Backend**: Supabase (Postgres + Realtime). Proyecto: `leno-portal-shopping`, región São Paulo (`sa-east-1`).
- Las credenciales que ves en el código (`SUPABASE_URL`, `SUPABASE_KEY`) son la clave pública ("publishable"), pensada para usarse en el navegador — no son secretas.
- Esquema de las tablas: `supabase_schema.sql` en este mismo repo.
- El "tiempo real" requiere que la replicación esté activada para las tablas `orders` y `promos` (Supabase → Database → Publications → `supabase_realtime`). Si algún día se recrea el proyecto de Supabase desde cero, no te olvides de este paso — sin él, el sitio funciona pero no sincroniza entre dispositivos.

## Por qué "Marcar listo" es un botón manual, a propósito

Se probó exhaustivamente (con pedidos reales de prueba) si la API de Fudo expone algún dato que indique cuándo un pedido de Mostrador está listo para retirar. Ni el estado de la venta (`saleState`) ni el estado de los ítems dentro del pedido reflejan de forma confiable las acciones del KDS. Conclusión: no hay señal automática disponible del lado de Fudo para este caso — el botón manual (que toca cocina) es la arquitectura definitiva, no un parche temporal.

## Fuentes de marca (opcional)

Hoy usa Anton (para títulos) y Montserrat (para texto) como reemplazo de las fuentes reales de LENO. Para usar las fuentes reales — Morganite y Argentum Sans, ambas gratuitas para uso comercial — subí estos dos archivos a una carpeta `/fonts/` en este mismo repo, con estos nombres exactos:

- `fonts/Morganite-Black.woff2`
- `fonts/ArgentumSans-Regular.woff2`

Si no los subís, no rompe nada — sigue funcionando con las fuentes de reemplazo.

## Pendiente

1. Definir el dispositivo final que va a correr Chrome conectado al TV (mini PC o compu con salida HDMI, configurada en 1920×1080, con Chrome en modo kiosco e inicio de sesión automático).
2. Confirmar con Diego el proceso de actualización de contenido de publicidad (ver `guia_publicidad_diego.md`).
3. Subir las fuentes reales de marca (opcional, ver arriba).

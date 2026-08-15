# LENO Portal Shopping — Pantalla de Retiro

Pantalla de retiro para clientes + panel de control para el local, en vivo en la sucursal de LENO en Portal Shopping (Tucumán).

## Qué es esto

- `index.html`: la app completa (pantalla de retiro + panel de control), en un solo archivo, sin build step.
- Los datos viven en una base de datos real (Supabase) y se sincronizan **en tiempo real** entre cualquier dispositivo que tenga esta página abierta.
- Los pedidos de Mostrador se importan **solos** desde Fudo — nadie los tipea a mano, salvo que se use el formulario manual como respaldo.

## Cómo se usa

- **Pantalla de Retiro**: se abre por defecto — turnos listos, en preparación, y el panel de publicidad rotando.
- **Panel de Control**: ícono de engranaje abajo a la izquierda. Ahí se ven los pedidos, se marca "Listo"/"Retirado", y se carga o desactiva contenido de publicidad (imagen por archivo o link de Google Drive).
- **Pantalla completa**: botón dedicado (ícono de flechas, al lado de la tuerquita, o dentro del Panel de Control) — activa el modo pantalla completa del navegador con un toque, sin instalar nada.

## Arquitectura

- **Frontend**: HTML/CSS/JS plano, alojado en GitHub Pages. La librería de Supabase JS **está incluida directo en el archivo** (no se descarga de un CDN externo) — esto fue clave para que funcionara en hardware de red restringida.
- **Backend**: Supabase (Postgres + Realtime). Proyecto `leno-portal-shopping`, región São Paulo (`sa-east-1`). Esquema de las tablas en `supabase_schema.sql`.
- **Integración con Fudo**: una Edge Function (`fudo-pedidos`, código en `fudo-pedidos-edge-function.ts`) actúa de proxy seguro — guarda el `apiKey`/`apiSecret` de Fudo como secrets de Supabase, nunca expuestos al navegador ni al repo. La Pantalla de Retiro consulta esa función **cada 8 segundos**, importa los pedidos de Mostrador nuevos (usando `fudo_sale_id` como clave de deduplicación vía `upsert` + `ignoreDuplicates`), y ese mismo ciclo de 8 segundos sirve además como respaldo de sincronización general — si la conexión de tiempo real fallara en algún dispositivo puntual, como máximo hay 8 segundos de demora en vez de necesitar F5.
- **Turno = número real de Fudo**: el número de turno que se muestra (`#57`, `#58`...) es el mismo `id` interno que usa Fudo como número de ticket — no se genera un número propio en paralelo.
- **Imágenes de promos**: son archivos reales en la carpeta `images/` (no texto base64 embebido) — más liviano y más confiable en hardware de bajos recursos.
- **Manejo de errores visible**: si algo falla al cargar, aparece una franja roja abajo de la pantalla con el mensaje de error — pensado para poder diagnosticar problemas en un dispositivo remoto sin acceso a herramientas de desarrollador, con solo una foto de la pantalla.

## Por qué "Marcar listo" es un botón manual, a propósito

Se probó exhaustivamente (con pedidos reales de prueba, varias rondas) si la API de Fudo expone algún dato que indique cuándo un pedido de Mostrador está listo para retirar. Ni el estado de la venta (`saleState`) ni el estado de los ítems dentro del pedido (`status`) ni el `saleIdentifier` reflejan ese momento de forma confiable para pedidos de Mostrador — esos campos existen, pero parecen pensados para el flujo de delivery, no mostrador. **Conclusión: no hay señal automática disponible del lado de Fudo para esto.** El botón manual (que toca cocina) es la arquitectura definitiva, no un parche temporal.

## Hardware — lo que funcionó y lo que no

- **Monitor comercial Samsung (línea QM, señalización digital)**: su navegador integrado no pudo cargar la app (fallos de certificados, imágenes, JavaScript nunca llegaba a ejecutar). No se resolvió por configuración ni actualización de firmware.
- **Caja Android genérica + Fully Kiosk Browser**: tampoco funcionó — el motor de navegador del sistema (WebView) de esta caja puntual no ejecutaba JavaScript en absoluto, ni lo más básico.
- **Lo que sí funcionó: la misma caja Android, con Google Chrome instalado desde Play Store.** Chrome trae su propio motor, independiente del WebView del sistema — evita por completo los problemas de los dos anteriores.
- **Lección para la próxima pantalla que se instale**: probar directamente con un navegador de motor propio (Chrome o Firefox) antes de invertir tiempo configurando el navegador que trae de fábrica cualquier TV o caja de señalización — ahorra varias vueltas de diagnóstico.

## Salvapantallas / que la pantalla no se apague

En la caja Android usada, el **launcher** (no el navegador) mostraba un fondo de pantalla genérico tipo salvapantallas después de un rato de inactividad — es un mecanismo del sistema, no algo que dependa de nuestro código, ya que detecta "inactividad" como ausencia de toques/control remoto, sin importar que la página siga actualizándose sola.

Dos capas de solución, en orden de importancia:

1. **Ajuste de Android (la solución real):** en el equipo, dentro de la configuración del salvapantallas del launcher, hay tres opciones de qué mostrar cuando se activa (`Launcher`, `Apagar la pantalla`, `Fondo de pantalla`) — elegir **`Apagar la pantalla`**. Además, en `Cuándo se activa` / `Poner el dispositivo en reposo`, elegir **`Nunca`**.
2. **Wake Lock en el código (refuerzo, no garantía):** el `index.html` pide al navegador mantener la pantalla activa mientras la pestaña esté abierta (`navigator.wakeLock`), y lo vuelve a pedir si la pestaña recupera visibilidad. No todos los navegadores lo soportan, y en equipos con un launcher personalizado (frecuente en cajas Android genéricas) puede no ser suficiente por sí solo — de ahí que el ajuste del punto 1 sea el que hay que priorizar.

Si en algún equipo nuevo el fondo genérico sigue apareciendo pese a las dos capas, buscar si el launcher tiene una app de configuración propia, separada de los ajustes generales de Android — es común en este tipo de hardware.

## Pantalla completa — dos caminos

1. **Botón dentro de la propia app** (ya implementado, es el que se está usando): un toque activa/desactiva el modo pantalla completa de Chrome. Bajo riesgo, no instala nada, se revierte con el mismo botón.
2. **Instalar como app vía "Agregar a pantalla de inicio"** (preparado con `manifest.json` e ícono en `images/icon-512.png`, pero no implementado todavía por decisión de no arriesgar algo que ya estaba funcionando bien). Si se retoma: en Chrome, menú → "Instalar app", y abrir desde el ícono nuevo en vez de desde Chrome directamente.

## Fuentes de marca (opcional, pendiente)

Hoy usa Anton (para títulos) y Montserrat (para texto) como reemplazo de las fuentes reales de LENO. Para usar las fuentes reales — Morganite y Argentum Sans, ambas gratuitas para uso comercial — falta subir estos dos archivos a una carpeta `fonts/` en este mismo repo, con estos nombres exactos:

- `fonts/Morganite-Black.woff2`
- `fonts/ArgentumSans-Regular.woff2`

Si no se suben, no rompe nada — sigue funcionando con las fuentes de reemplazo.

## Pendiente

1. **Diseño visual de "Listo para retirar" / "En preparación"**: en exploración — se descartaron varias propuestas de estilo (tarjetas escaladas, contorno, insignia, tickets, tablero tipo aeropuerto, tipografía pura); todavía no hay una dirección aprobada. Ver historial de la conversación de diseño para las opciones ya descartadas, así no se repiten.
2. **Escalones de tamaño según cantidad de pedidos**: idea aprobada en concepto (1-3 pedidos grande, 4-6 mediano, 7+ chico con resumen "+N más"), pendiente de aplicar una vez que se defina el estilo visual del punto 1.
3. Confirmar con Diego el proceso de actualización de contenido de publicidad (ver `guia_publicidad_diego.md`).
4. Subir las fuentes reales de marca (opcional, ver arriba).
5. Cartel/recordatorio físico de 3 pasos para cocina sobre cuándo y cómo tocar "Marcar listo".

## Seguridad — nota para quien retome esto

Las políticas de acceso (RLS) de las tablas `orders` y `promos` en Supabase son abiertas (`using (true) with check (true)`) — cualquiera con la clave pública del proyecto puede leer y escribir. Es una decisión consciente: no hay datos sensibles de clientes en estas tablas. Si esto escala a más sucursales o se agregan datos sensibles, hay que revisar estas políticas antes de continuar.

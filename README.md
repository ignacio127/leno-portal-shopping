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
- **Integración con Fudo**: una Edge Function (`fudo-pedidos`, código en `fudo-pedidos-edge-function.ts`) actúa de proxy seguro — guarda el `apiKey`/`apiSecret` de Fudo como secrets de Supabase, nunca expuestos al navegador ni al repo. La Pantalla de Retiro consulta esa función **cada 8 segundos**, e importa los pedidos de Mostrador nuevos (usando `fudo_sale_id` como clave de deduplicación vía `upsert` + `ignoreDuplicates`). Desde el 17/08/2026, solo la vista de Pantalla de Retiro ejecuta este polling — el Panel de Control ya no lo necesita (ver Historial de cambios).
- **Respaldo de sincronización general**: un `setInterval` propio de **60 segundos** (independiente del ciclo de 8s de Fudo, desde el 17/08/2026 — ver Historial de cambios) refresca `orders`/`promos` en cualquier vista, aunque no haya pedidos nuevos de Fudo. Cubre el caso de que la conexión de tiempo real falle silenciosamente en algún dispositivo puntual. En el uso normal, la sincronización entre dispositivos la hace Realtime de forma prácticamente instantánea (un par de segundos) — este respaldo es el peor escenario, no el mecanismo principal de sincronización.
- **Detalle real de productos**: la función de Fudo trae también qué productos tiene cada pedido (`include=items.product`), y ese detalle se guarda en la columna `item` de cada pedido. Es una parte del código agregada sin haberse probado en vivo todavía con un pedido real — el parseo está blindado con try/catch y cae a un texto genérico ("Pedido de Mostrador") si la estructura no coincide con lo esperado, así que no debería romper nada aunque el detalle no llegue a resolverse bien la primera vez. **Pendiente: confirmar con un pedido real que el detalle se arma correctamente.**
- **El detalle vive solo en el Panel de Control, nunca en la Pantalla de Retiro**: la tarjeta roja de "Listo para retirar" muestra únicamente el número de turno (y el nombre del cliente, si Fudo lo informó) — nunca el detalle de productos. Es una separación deliberada: el cliente no necesita ver en una pantalla pública qué pidió, ese dato es solo para uso interno del local.
- **Escalones de tamaño en "Listo para retirar"**: la tarjeta se achica sola en dos pasos según cuántos pedidos haya al mismo tiempo — 1 a 3 pedidos, tamaño normal; 4 a 6, ~65%; 7 o más, ~48% (el piso antes de que deje de leerse bien de lejos), mostrando los últimos 6 y agrupando el resto en una tarjeta de resumen ("+N más"). Mismo estilo de tarjeta que ya está en producción, solo cambia el tamaño.
- **Turno = número real de Fudo**: el número de turno que se muestra (`#57`, `#58`...) es el mismo `id` interno que usa Fudo como número de ticket — no se genera un número propio en paralelo.
- **Imágenes de promos**: son archivos reales en la carpeta `images/` (no texto base64 embebido) — más liviano y más confiable en hardware de bajos recursos.
- **Manejo de errores visible**: si algo falla al cargar, aparece una franja roja abajo de la pantalla con el mensaje de error — pensado para poder diagnosticar problemas en un dispositivo remoto sin acceso a herramientas de desarrollador, con solo una foto de la pantalla.
- **Estados de un pedido** (desde el 18/08/2026 — ver Historial de cambios): `preparando` → `listo` → `retirado`. "Retirado" ya **no borra la fila** — queda visible en "Retirados recientes" (Panel de Control) durante 10 minutos, con un botón "Deshacer" que lo vuelve a `listo`. Pasado ese tiempo se limpia solo (`loadAll()` borra los retirados vencidos en cada corrida, sin necesitar un cron aparte).

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

## Historial de cambios

### 18/08/2026 — Deshacer "retirado", detalle destacado y ajustes móviles (Ramiro)

Tres mejoras operativas al Panel de Control, sin relación con el fix de Egress del 17/08 (ver abajo) más allá de haber sido diseñadas con el mismo cuidado de no reintroducir tráfico innecesario.

1. **Deshacer "Marcar retirado"**: antes, tocar "Marcar retirado" borraba el pedido de la base al instante, sin posibilidad de recuperarlo. Ahora pasa a un estado `retirado` con su propio timestamp (`ts_retirado`), queda visible 10 minutos en una lista nueva ("Retirados recientes") con un botón "Deshacer", y se limpia solo después. El filtro de qué retirados mostrar se hace **en el servidor** (`.or()` en la consulta a Supabase), no trayendo todo y filtrando en JavaScript — para que esto no vuelva a crecer sin límite como pasó con el bug de Egress.
2. **Detalle del pedido destacado**: el nombre y cantidad de cada producto (columna `item`) ya se traía antes, pero se mostraba chico y mezclado con el tiempo transcurrido. Ahora tiene su propio bloque, con cada producto en su línea. No se agregó ningún dato nuevo ni ninguna consulta nueva — es solo presentación.
3. **Ajustes de Panel de Control en teléfono**: padding reducido y botones más grandes (mínimo 44px de alto) por debajo de 480px de ancho de pantalla. No afecta la Pantalla de Retiro — usa una regla CSS separada, con un breakpoint muy por debajo de cualquier resolución de TV/monitor.

**Requirió una migración de esquema antes de publicar este `index.html`** — ver sección "Migraciones aplicadas" más abajo (ya corrida y confirmada).

### 18/08/2026 (continuación) — Fix de detalle de productos Fudo, ocultar detalle en Pantalla de Retiro pública, migración de `estado` (Ramiro)

Tres problemas distintos detectados y corregidos el mismo día, en el mismo local piloto — documentados juntos porque los tres tocan el mismo flujo (pedidos de Mostrador → Fudo → esta app), aunque las causas no tienen relación entre sí.

1. **Causa raíz del detalle genérico ("Pedido de Mostrador") en todos los pedidos reales**: confirmado con datos reales de Fudo (no supuesto) que este local cierra/cobra las ventas de Mostrador casi al instante, pasando su `saleState` a `CLOSED` — y ese es justo el estado donde Fudo completa `relationships.items.data` con el detalle real de productos. El filtro de la Edge Function (`fudo-pedidos-edge-function.ts`) excluía `CLOSED` (`filter[saleState]=in.(PENDING,IN-COURSE,READY-TO-DELIVER)`), por lo que nunca se traía el detalle real, solo el fallback genérico. **Fix**: se agregó `CLOSED` a la lista de estados permitidos. Los pedidos ya importados antes del fix (con texto genérico) no se corrigen solos — quedan así por diseño, para no arriesgar sobrescribir el estado de pedidos que el staff ya venía gestionando (`ignoreDuplicates:true` en el `upsert`).
2. **El detalle de productos aparecía en la Pantalla de Retiro pública, no solo en el Panel de Control**: en la columna "En preparación" de la pantalla que ven los clientes, cuando un pedido no tenía `nombre` (el caso típico de los pedidos de Fudo), el código caía a mostrar el detalle completo de productos ahí mismo. Antes pasaba casi desapercibido porque el fallback era el texto genérico corto; al arreglarse el punto 1, empezó a mostrar el pedido completo en la pantalla pública. **Fix**: se sacó ese fallback — la Pantalla de Retiro ahora solo muestra el número de turno (y el nombre, si existe), nunca el detalle de productos. El Panel de Control no se tocó, sigue mostrando el detalle completo (Mejora 2 del punto anterior).
3. **La función "Marcar retirado" no hacía nada**: la tabla `orders` tenía una restricción `CHECK` (`orders_estado_check`) que solo permitía `estado IN ('preparando','listo')` — un remanente de cuando "retirado" significaba "fila borrada", no un valor real de la columna. Al pasar a un modelo de soft-delete (punto 1 del 18/08 más arriba), cualquier intento de `UPDATE ... SET estado='retirado'` violaba la restricción y fallaba en silencio (cartel rojo, sin detalle útil del error). **Fix**: se amplió la restricción para incluir `'retirado'` — ver SQL en "Migraciones aplicadas".

**Nota aparte, sin relación con el código de `index.html`**: durante el diagnóstico del punto 1 se agregaron temporalmente dos líneas de `console.log` de diagnóstico en la Edge Function (`FUDO_RAW_SAMPLE`, `FUDO_DIAG_SAMPLE`). **Pendiente: sacarlas** una vez confirmado que el fix es estable (ver Pendiente, punto 11). También, en una edición intermedia de esa función se introdujo por error una declaración duplicada de `const params`, causando una caída total de la función (`BootFailure`) por unos minutos — corregido de inmediato; se documenta acá solo como registro del incidente, no requiere ninguna acción de seguimiento.

### 17/08/2026 — Optimización de Egress (Ramiro)

El proyecto de Supabase excedió la cuota de Egress del plan gratuito (112% en los primeros 6 días del ciclo de facturación). Diagnóstico confirmado con datos reales de los Logs de Supabase (API Gateway) y lectura directa del código — causa raíz:

- `loadAll()` (el refresco completo de `orders`/`promos`) corría **sin condición, cada 8 segundos, en cada dispositivo conectado** (Pantalla de Retiro y Panel de Control), dentro del mismo ciclo de polling a Fudo — se disparaba hubiera o no cambios reales que mostrar.
- El Panel de Control (celular) ejecutaba el mismo polling a Fudo que la Pantalla de Retiro, sin necesitarlo — duplicando innecesariamente la carga cuando había más de un dispositivo conectado.
- Las lecturas usaban `select('*')`, trayendo columnas que la app nunca usa.

Cambios aplicados en `index.html`:

1. El refresco completo (`loadAll()` + `renderCurrent()`) ahora solo corre cuando Fudo efectivamente devuelve pedidos nuevos.
2. Se agregó un respaldo de sincronización independiente, cada **60 segundos** (antes: 8s, sin condición), para cubrir fallas silenciosas de la conexión de Realtime — ver detalle en "Arquitectura".
3. El polling a Fudo ahora solo corre en la vista de Pantalla de Retiro (`currentView === 'display'`) — el Panel de Control ya no lo ejecuta.
4. Las lecturas de `orders`/`promos` pasaron de `select('*')` a columnas explícitas (`ORDER_COLUMNS`/`PROMO_COLUMNS` en el código).

Se evaluó y se descartó migrar la infraestructura (a AWS u otra plataforma) como respuesta a este incidente: la causa era un patrón de código, no una limitación de la plataforma. Con este fix, el uso esperado de la sucursal piloto debería quedar cómodo dentro del plan gratuito de Supabase.

**Pendiente de verificar**: confirmar en los Logs de Supabase, 24-48hs después del deploy, que el volumen de `GET /rest/v1/orders` y `/promos` bajó como se esperaba.

**Detectado en la misma auditoría, todavía sin resolver** (candidato a una futura optimización de bytes transferidos al cliente): la librería de Supabase JS y el logo de marca están incluidos como texto plano/base64 directo dentro de `index.html` (ver "Arquitectura" más arriba) — esto impide que el navegador los cachee por separado entre recargas. Evaluar extraerlos a archivos aparte sin perder la independencia de CDN externo que motivó incluirlos así originalmente.

## Migraciones aplicadas — 18/08/2026

Corridas y confirmadas en el proyecto `leno-portal-shopping` antes de publicar el `index.html` del 18/08/2026:

```sql
alter table public.orders add column if not exists ts_retirado timestamptz;
```

```sql
alter table public.orders drop constraint orders_estado_check;

alter table public.orders
  add constraint orders_estado_check
  check (estado = any (array['preparando'::text, 'listo'::text, 'retirado'::text]));
```

La segunda migración se agregó **después** de detectar en producción que "Marcar retirado" no funcionaba — el constraint original (confirmado vía `information_schema.check_constraints`) solo permitía `'preparando'`/`'listo'`, remanente de cuando "retirado" significaba borrado de fila, no un valor de `estado`. Ver Historial de cambios, 18/08/2026 (continuación).

## Pendiente

1. **Diseño visual de fondo de "Listo para retirar" / "En preparación"**: en exploración — se descartaron varias propuestas de estilo (tarjetas escaladas, contorno, insignia, tickets, tablero tipo aeropuerto, tipografía pura); todavía no hay una dirección aprobada. Esto es independiente de los escalones de tamaño (ver punto 2, ya implementado) — si algún día se cambia el estilo de la tarjeta, los mismos escalones se le aplican igual.
2. ~~Escalones de tamaño según cantidad de pedidos~~ — **implementado**: 1-3 pedidos tamaño normal, 4-6 ~65%, 7+ ~48% con resumen "+N más". Mismo estilo de tarjeta actual.
3. ~~Verificar en vivo el detalle de productos desde Fudo~~ — **confirmado el 18/08/2026**: funcionaba mal por un filtro de `saleState` que excluía `CLOSED` (ver Historial de cambios). Ya corregido y confirmado con pedidos reales (#625, #614, etc. mostrando detalle real).
4. Confirmar con Diego el proceso de actualización de contenido de publicidad (ver `guia_publicidad_diego.md`).
5. Subir las fuentes reales de marca (opcional, ver arriba).
6. Cartel/recordatorio físico de 3 pasos para cocina sobre cuándo y cómo tocar "Marcar listo".
7. **Verificar la caída de Egress post-fix del 17/08/2026** (ver Historial de cambios) en los Logs de Supabase.
8. Evaluar extraer la librería de Supabase JS y el logo de marca a archivos aparte, cacheables por el navegador (detectado en la auditoría del 17/08/2026, ver Historial de cambios).
9. ~~Correr la migración de `ts_retirado` y del `CHECK` de `estado`~~ — **hecho el 18/08/2026** (ver "Migraciones aplicadas" arriba).
10. Probar en vivo el flujo completo de "Deshacer retirado" (marcar retirado → aparece en Retirados recientes → deshacer → vuelve a Listos) antes de dar la Mejora 1 por cerrada. **Pendiente de confirmación tras el fix del `CHECK` constraint.**
11. **Sacar los `console.log` de diagnóstico de la Edge Function** (`FUDO_RAW_SAMPLE`, `FUDO_DIAG_SAMPLE`) una vez confirmado que el fix de `saleState` es estable — quedaron para debug, no deben quedar en producción indefinidamente.
12. **Resolver quién controla el repo de GitHub Pages** que sirve esta app (`ignacio127/leno-portal-shopping`) — evaluar migrarlo a una cuenta/organización propia de LENO para no depender de una cuenta personal de un tercero para algo que corre en producción todos los días.

## Seguridad — nota para quien retome esto

Las políticas de acceso (RLS) de las tablas `orders` y `promos` en Supabase son abiertas (`using (true) with check (true)`) — cualquiera con la clave pública del proyecto puede leer y escribir. Es una decisión consciente: no hay datos sensibles de clientes en estas tablas. Si esto escala a más sucursales o se agregan datos sensibles, hay que revisar estas políticas antes de continuar.

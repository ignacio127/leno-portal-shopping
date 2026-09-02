# LENO Portal Shopping — Pantalla de Retiro

Pantalla de retiro para clientes + panel de control para el local, en vivo en la sucursal de LENO en Portal Shopping (Tucumán).

## Qué es esto

- `index.html`: la app completa (pantalla de retiro + panel de control), en un solo archivo, sin build step.
- `kds.html`: tablero interno de demoras de preparacion y retiro, para gerencia y encargados (ver seccion mas abajo). No lo usa el local ni lo ve el cliente.
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
- **Imágenes de promos — regla dura**: la columna `image_url` de la tabla `promos` guarda **siempre una ruta o una URL, nunca la imagen**. Los archivos viven en la carpeta `images/` del repo (o, cuando se implemente, en Supabase Storage). Guardar una imagen en base64 dentro de la fila cuesta ~24 GB de Egress por día — pasó el 31/08/2026, ver Historial de cambios. Desde el 01/09/2026 hay una restricción en la base (`promos_no_base64`) que hace fallar cualquier `insert` o `update` con un `data:` en ese campo. **No sacarla.** Especificación del arte: 1080x1440 px, que se sube optimizado a 960x1280 JPEG (~200 KB).
- **Manejo de errores visible**: si algo falla al cargar, aparece una franja roja abajo de la pantalla con el mensaje de error — pensado para poder diagnosticar problemas en un dispositivo remoto sin acceso a herramientas de desarrollador, con solo una foto de la pantalla.
- **Estados de un pedido** (desde el 18/08/2026 — ver Historial de cambios): `preparando` → `listo` → `retirado`. "Retirado" ya **no borra la fila** — queda visible en "Retirados recientes" (Panel de Control) durante 10 minutos, con un botón "Deshacer" que lo vuelve a `listo`. Pasado ese tiempo se limpia solo (`loadAll()` borra los retirados vencidos en cada corrida, sin necesitar un cron aparte).

## KDS LENO — tablero de demoras (`kds.html`)

Página separada, para uso interno de gerencia y encargados. **No la ve el cliente ni la carga el TV del local**: es un archivo independiente que no toca `index.html` ni el flujo de la Pantalla de Retiro.

- **URL**: `https://ignacio127.github.io/leno-portal-shopping/kds.html`
- **Qué mide**: los tiempos que ya se venían guardando en `orders` sin usarse — `created_at` → `ts_listo` (preparación) y `ts_listo` → `ts_retirado` (retiro).
- **Cómo lee los datos**: `fetch` directo a la API REST de Supabase, trayendo solo cuatro columnas (`created_at`, `ts_listo`, `ts_retirado`, `estado`) y filtrando por fecha del lado del servidor. **Sin Realtime, sin polling, sin `select('*')`** — se carga solo cuando alguien toca "Actualizar" o cambia el período. Es una decisión deliberada después del incidente de Egress del 17/08/2026: esta página no puede generar tráfico de fondo.
- **Períodos**: 7, 14 o 30 días, más un selector de fechas libre. El rango incluye el día final completo. Si una consulta llegara al tope de 8.000 filas, la página avisa que los números están calculados sobre una parte del período — no trunca en silencio.
- **Sin dependencias externas**: los logos de LENO y de Fudo van embebidos en base64 dentro del archivo, así que funciona igual abierto localmente o desde GitHub Pages, sin depender de `images/`. Los gráficos son CSS y SVG nativo, sin librerías.
- **Tipografías**: usa las mismas reglas `@font-face` que el resto del proyecto (Morganite y Argentum Sans desde `fonts/`), con Anton y Montserrat como respaldo hasta que se suban los archivos reales. Ver "Fuentes de marca" más arriba.

### Las tres categorías de tiempo

| Categoría | Umbral | Qué significa |
|---|---|---|
| A tiempo | hasta 15 min | Cumplió el compromiso de preparación |
| Demorado | 15 a 45 min | Salió, pero tarde |
| Marcado tarde | más de 45 min | Nadie lo marcó en su momento; ese cliente nunca vio su turno en la pantalla |

Los "demorados" **incluyen** a los "marcados tarde" — son un subconjunto, no dos grupos separados. El tablero lo aclara en la tarjeta para que nadie sume los dos números.

Un pedido con más de 45 minutos no significa que el cliente esperara todo ese tiempo: la hamburguesa se entregó igual, de viva voz en el mostrador. Lo que falló es que el pedido quedó colgado en "En preparación" hasta que alguien limpió la lista más tarde. La métrica mide el uso del Panel de Control, no la cocina.

### Metas

- Pedidos demorados: menos del 15%
- Marcados tarde: menos del 2%
- Media de preparación: debajo de 15 minutos
- Pedidos retirados: arriba del 95%

Los umbrales salen de los datos reales de agosto de 2026: la mediana de preparación se movía entre 8 y 15 minutos según la hora, con el 70% de los pedidos entrando dentro de los 15.

### Lo que mostraron los primeros datos

- **Los problemas de marcado aparecen en horas flojas, no en el pico.** Las bandas de 13–15h y 19–22h concentran el 76% del volumen y quedan por debajo del 2% de marcados tarde. Las bandas flojas (10–12h, 16–18h y 23–00h) son el 24% del volumen y generan el 80% de los fallos. La hipótesis es que en el rush hay presión —clientes preguntando, pantalla llena, más gente en caja— y con el local vacío no hay nada que obligue a marcar.
- **La cocina también es más lenta cuando está vacía**: la mediana a las 16h ronda los 18 minutos contra 9 a las 20h.
- **El botón "Marcar retirado" sí se usa**: más del 99% de los pedidos que llegan a "listo" se cierran a mano. El problema está solo en el tramo de preparación.

### Privacidad

El repo es público, así que la URL es accesible para cualquiera que la conozca. Lleva `noindex` y no está enlazada desde ningún lado, pero **no es una página privada**. No contiene datos de clientes ni montos, solo tiempos de preparación. Si en algún momento hace falta control de acceso real, la vía es Cloudflare Access.

### Pendiente

- Alerta visual en el Panel de Control cuando un pedido pasa los 20 minutos en "preparando" (amarillo) y los 45 (rojo). Esto sí toca `index.html`. Es la intervención que corrige el problema — el tablero solo lo mide.
- Aviso sonoro en el Panel de Control al cruzar los 20 minutos. Requiere confirmar antes si el Panel queda abierto en algún dispositivo del local durante el servicio; si no, el sonido no suena y hay que resolverlo de otra forma.
- Tiempo de preparación configurable por franja horaria, en lugar de los 15 minutos fijos en el código.
- Averiguar qué pasa entre las 17 y las 18h, la banda con peor marcado. Podría ser el cambio de turno.

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

1. **Ajuste de Android (la solución real):** `Configuración` → `Preferencias del dispositivo` → `Opciones para desarrolladores` → activar **`Pantalla siempre encendida al cargar`** (`stay_on_while_plugged_in`). La caja se reporta a sí misma como "cargando" pese a no tener batería, así que el ajuste aplica. Aplicado el 16/08/2026 y funcionando desde entonces.

   Un intento anterior — dentro del menú de salvapantallas del launcher, elegir `Apagar la pantalla` y `Nunca` — **no persistía**: el ajuste se revertía solo sin necesidad de reiniciar. Ese es el procedimiento que quedó documentado por error en la guía operativa hasta el 22/08/2026; ver Historial de cambios.

   **CERRADO el 30/08/2026.** El ajuste se encontró activo en todas las revisiones del período de verificación (17/08, 20/08, 23/08 y el cierre del 30/08). Conclusión: en este equipo el ajuste persiste y no hace falta reemplazar el hardware. Queda como procedimiento estándar para cualquier caja nueva que se instale.

   Si en algún momento futuro aparece desactivado, la conclusión cambia: significaría que cualquier arreglo por software se revierte en este equipo, y correspondería reemplazarlo en vez de reintentar por software.
2. **Wake Lock en el código (refuerzo, no garantía):** el `index.html` pide al navegador mantener la pantalla activa mientras la pestaña esté abierta (`navigator.wakeLock`), y lo vuelve a pedir si la pestaña recupera visibilidad. No todos los navegadores lo soportan, y en equipos con un launcher personalizado (frecuente en cajas Android genéricas) puede no ser suficiente por sí solo — de ahí que el ajuste del punto 1 sea el que hay que priorizar.

Si en algún equipo nuevo el fondo genérico sigue apareciendo pese a las dos capas, buscar si el launcher tiene una app de configuración propia, separada de los ajustes generales de Android — es común en este tipo de hardware.

## Pantalla completa — tres caminos

1. **Capa de inicio "TOCAR PARA INICIAR"** (desde el 22/08/2026, es la vía principal — ver Historial de cambios): al cargar la página aparece una capa roja a pantalla completa con el logo y la instrucción. Un toque la cierra y dispara `requestFullscreen()`. Se descarta sola a los 60s y vuelve a aparecer si alguien sale del modo completo.
2. **Botón dentro de la propia app** (sigue existiendo, sin cambios): el ícono de flechas al lado de la tuerca, o el botón dentro del Panel de Control. Un toque activa/desactiva. Es la misma función `toggleFullscreen()` de siempre — la capa no la reemplaza, le agrega un disparador que no se puede pasar por alto.
3. **Instalar como app vía "Agregar a pantalla de inicio"** (preparado con `manifest.json` e ícono en `images/icon-512.png`, pero no implementado todavía por decisión de no arriesgar algo que ya estaba funcionando bien). Es el **único camino con cero toques**: instalada, la app arranca sin barras y sin depender de nadie. Si se retoma: en Chrome, menú → "Instalar app", y abrir desde el ícono nuevo en vez de desde Chrome directamente. **Riesgo conocido no verificado:** los launchers de cajas Android genéricas a veces no muestran los accesos directos que crea Chrome — solo se comprueba en una visita física.

## Fuentes de marca (opcional, pendiente)

Hoy usa Anton (para títulos) y Montserrat (para texto) como reemplazo de las fuentes reales de LENO. Para usar las fuentes reales — Morganite y Argentum Sans, ambas gratuitas para uso comercial — falta subir estos dos archivos a una carpeta `fonts/` en este mismo repo, con estos nombres exactos:

- `fonts/Morganite-Black.woff2`
- `fonts/ArgentumSans-Regular.woff2`

Si no se suben, no rompe nada — sigue funcionando con las fuentes de reemplazo.

## Historial de cambios

### 01/09/2026 — Segundo incidente de Egress: una promo guardada en base64 (Ramiro)

**Qué pasó.** El Egress de Supabase saltó de prácticamente cero a **9,5 GB el 31/08 y 23,95 GB el 01/09**, 100% PostgREST. La cuota del plan gratuito es de 5 GB por mes.

**Causa raíz.** La promo "Doble Cheeseburger 30% OFF", cargada el 31/08 a las 16:00 UTC **desde el Panel de Control**, guardó la imagen como texto base64 dentro de `image_url`: 2.256.930 caracteres, una fila de 2,26 MB. La Pantalla de Retiro consulta `GET /rest/v1/promos` unas 15.400 veces por día y el `select` incluye `image_url`, así que bajaba ~1,55 MB (comprimido) en cada consulta. 15.411 x 1,55 MB = 23,95 GB — coincide exacto con lo facturado.

No fue un error de quien cargó la promo: el Panel hacía exactamente lo que decía su código. En `index.html`, el manejador del input de archivo llamaba a `reader.readAsDataURL(file)` y guardaba el resultado en `image_url`. El límite de 3,5 MB del formulario no protegía de nada — una imagen de 2,26 MB lo pasaba sin problema.

**Método de diagnóstico** (sirve para el próximo incidente): agrupar `edge_logs` por `request.method` + `request.path` + `request.search` para ver qué endpoint concentra las consultas, y después medir `pg_column_size()` de las filas de la tabla sospechosa. Los logs **no** traen bytes de respuesta confiables (`content_length` viene en 0), así que el cálculo es consultas x tamaño de fila.

Clientes detectados consultando, todos desde la misma IP de Yerba Buena: la caja Android del local (12.226/día), un celular Android (1.960) y dos Chrome de Windows (967 y 258). Los tres últimos son pestañas abiertas de más — suman un 26% de tráfico sin aportar nada.

**Por qué no se atacó la frecuencia.** Bajar el intervalo de consulta y cerrar las pestañas de más se evaluaron y se descartaron como inviables en la operación real. Eso deja **el tamaño de la respuesta como la única palanca de control disponible** — de ahí que la regla sea que nada pesado puede volver a entrar en la tabla `promos`, y que la restricción de base sea obligatoria y no opcional.

**Qué se hizo:**

1. Las dos artes activas se optimizaron a 960x1280 JPEG (172 KB y 203 KB; venían en 1080x1440, o sea ya en el 3:4 correcto) y se subieron a `images/`.
2. Las filas de `promos` pasaron a apuntar a `./images/doble-cheese-30off.jpg` y `./images/bucket-24500.jpg`. `pg_column_size` bajó de 2.257.032 bytes a **128 y 232 bytes**.
3. Restricción de base aplicada y **probada con caso negativo** (un `insert` de prueba con `data:image/png;base64,...` fue rechazado, dentro de una transacción que se abortó):

```sql
alter table promos add constraint promos_no_base64
  check (image_url is null or left(image_url, 5) <> 'data:');
```

Egress proyectado después del fix: menos de 15 MB por día, contra los 720 GB/mes a los que iba.

**Consecuencia operativa mientras tanto.** Hasta que se haga el deploy del Panel (ver Pendiente), **Diego no puede cargar promos con imagen**: el `insert` le va a fallar por la restricción. Dos vías de carga hasta entonces — Ramiro sube el arte a `images/` y hace el `insert` por SQL (funciona hoy), o se espera al deploy de Supabase Storage.

**Lección.** El control que faltaba no era una instrucción ni una capacitación: era una restricción en la base. Una acción normal, hecha por una persona no técnica usando el sistema como estaba diseñado, generó 24 GB en un día. Buscar ese mismo patrón en el resto del proyecto.

### 22/08/2026 — Capa de inicio en pantalla completa (Ramiro)

**Problema.** La pantalla quedaba seguido con la barra de direcciones de Chrome a la vista. El diagnóstico inicial ("se olvidan de apretar el botón") era incompleto: el botón de pantalla completa ya existía desde siempre, pero es un `.gear-btn` de 2.6vw al 50% de opacidad en una esquina inferior. Un paso manual que depende de memoria humana, sin señal de error cuando no se ejecuta, falla siempre a una tasa distinta de cero. No es un problema de disciplina del personal: es un defecto de diseño del procedimiento de apertura.

El impacto real no es estético. La barra de direcciones es un **elemento táctil activo** en una pantalla al alcance del público en un shopping: un toque puede sacar la pantalla del sitio, y el fallo es silencioso hasta que un cliente reclama su pedido.

**Restricción técnica.** No se puede automatizar con un temporizador. `requestFullscreen()` exige *transient user activation*: llamada fuera de un gesto real del usuario, el navegador la rechaza. Es una defensa antiabuso de todos los navegadores, sin flag para saltearla desde la página. Tampoco es persistente: cualquier recarga la destruye.

**Interacción con el watchdog del 18/08.** El `location.reload()` que se agregó para destrabar la pantalla congelada **también destruye el modo pantalla completa cada vez que se dispara**, en silencio. La capa es lo que permite recuperarlo después de esas recargas.

**Solución.** Una capa (`#startup-overlay`) que se muestra al cargar, por encima de todo (`z-index:9000`), fuera de ambos contenedores `.view` para que no la afecte `.view{display:none}`. Un toque la cierra y dispara el mismo pedido de fullscreen que ya usaba `toggleFullscreen()` — la única diferencia es de dónde sale el gesto.

Detalles de la implementación:

- **Auto-descarte a los 60s.** Si el box se reinicia a mitad de servicio (corte de luz, o el watchdog de 3 min sin sincronizar) y no hay nadie enfrente, la capa se va sola. Se pierde el modo completo, nunca se tapan los turnos. Este es el riesgo principal del diseño y su mitigación.
- **Reaparece sola** al detectar `fullscreenchange` sin `fullscreenElement`.
- **No aparece por debajo de 1000px de ancho** — abrir el Panel de Control desde el teléfono no debe exigir un toque ni tirar el teléfono a pantalla completa.
- **No aparece si `currentView !== 'display'`.**
- **El logo se clona en runtime** del `<img alt="LENO">` del header en vez de duplicar los 64 KB de base64. Sin filtros de color: el logo es la mascota a todo color y un `brightness(0) invert(1)` lo aplasta a una silueta blanca sin rasgos (se probó y se descartó). El contorno negro ya lo separa del fondo rojo.

**Cero modificaciones a código existente.** Tres inserciones (CSS, HTML, JS) más una línea en el arranque. `toggleFullscreen()`, `requestWakeLock()`, el watchdog, el polling de Fudo y la librería de Supabase quedaron intactos — verificado con `diff`: 0 líneas eliminadas.

**Validación.** `node --check` sobre los dos bloques `<script>`; balance de llaves del CSS (159/159); y 12 pruebas funcionales con jsdom contra el archivo real, cubriendo: estado inicial, clonado del logo, contador, el toque disparando fullscreen exactamente una vez, el fundido, la no-reaparición estando en fullscreen, la reaparición al salir, los dos guardas (ancho y vista) y el auto-descarte con el contador acortado.

**Corrección de la guía operativa (mismo día).** Al armar el PDF se detectó que la Sección 2 de `README_DE_USO_OPERATIVO.md` todavía describía el intento fallido del salvapantallas (menú del launcher → `Nunca`) en vez del ajuste del 16/08 en Opciones para desarrolladores. Corregido en la guía, en las preguntas frecuentes y en el bloque de datos a reportar. Cualquier copia impresa anterior al 22/08/2026 manda al menú equivocado y hay que reemplazarla.

**Supuesto no verificado.** Nunca se le preguntó al personal de Portal *por qué* no usaban el botón que ya existía. Si resulta que sí lo apretaban y algo los sacaba del modo completo, la causa es otra y esto no la resuelve — pero el auto-descarte y la reaparición automática igual mejoran el peor caso.

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

### 18/08/2026 (continuación 2) — Bug: pedidos "retirado" resucitaban solos en "En preparación" (Ramiro, detectado en vivo)

Detectado en producción pocas horas después de publicar la Mejora 1: varios pedidos ya marcados "Retirado" (confirmados en la lista "Retirados recientes" con su botón "Deshacer") **volvían a aparecer en "En preparación"** al rato, como si nunca se hubieran gestionado.

**Causa raíz**: la limpieza automática de `loadAll()` usaba la misma ventana de 10 minutos (`RETIRADO_VISIBLE_MIN`) tanto para dejar de *mostrar* un pedido retirado como para *borrarlo de la base de verdad*. La Edge Function de Fudo (`fudo-pedidos`) no importa "solo lo nuevo" — en cada consulta trae las últimas 25 ventas de Mostrador, hayan sido importadas antes o no. Mientras la fila del pedido siga existiendo en `orders`, el `upsert` con `ignoreDuplicates:true` la reconoce y no hace nada. Pero en cuanto la fila se borra (a los 10 minutos), ese `fudo_sale_id` deja de estar "ocupado" — y si esa venta todavía aparece entre las últimas 25 de Fudo (muy probable, sobre todo en horas pico con muchos pedidos por minuto), el próximo poll la reimporta como si fuera nueva, con `estado:'preparando'` por defecto. El pedido "resucitaba" en preparación, con el mismo número de turno, aunque ya se había entregado.

**Fix**: se separaron las dos ventanas. `RETIRADO_VISIBLE_MIN` (10 minutos) sigue controlando solo qué se *muestra* en pantalla. Se agregó `RETIRADO_DELETE_HORAS` (24 horas) para el borrado real — tiempo de sobra para que, incluso en el ritmo de pedidos más alto visto hasta ahora, Fudo haya dejado esa venta bien afuera de sus últimas 25 antes de que la fila se borre de verdad.

**No se requiere limpieza manual de los pedidos que ya resucitaron**: al no existir más el bug, alcanza con volver a marcarlos "Listo" → "Retirado" con el flujo normal — no van a volver a resucitar, porque ahora la fila permanece 24hs antes de borrarse.

### 18/08/2026 (continuación 3) — El bug anterior tenía otra causa real: sincronización muerta en un dispositivo, no la base (Ramiro)

Después de desplegar el fix de arriba, el síntoma **volvió a aparecer** (pedido #653 otra vez visible en "En preparación" después de estar "Retirado"). Antes de tocar más código, se verificó directo en la base:

- `orders_fudo_sale_id_unique` existe como restricción `UNIQUE` real sobre `fudo_sale_id` — el `upsert` con `ignoreDuplicates` sí tiene con qué detectar conflictos.
- La fila de `#653` en la base era **una sola**, con `estado = 'retirado'` correctamente. **No había ninguna fila duplicada ni revertida.**

Conclusión: el dato en Supabase siempre estuvo bien. Lo que fallaba era que un dispositivo puntual (la Pantalla de Retiro, en este caso) dejó de recibir actualizaciones — ya sea porque la suscripción de Realtime se cortó en silencio (algo que puede pasar con websockets en redes de wifi/datos inestables) o porque el navegador pausó los `setInterval` en segundo plano — y siguió mostrando en memoria una copia vieja del pedido, de antes de marcarlo "Retirado". No era una resurrección real en la base, era una pantalla congelada mostrando datos viejos.

Esto también expuso que el indicador de "sincronizado hh:mm:ss" (`#sync-note`) existía en el código desde antes pero tenía `display:none` fijo — nunca se veía, así que no servía para detectar este tipo de falla a simple vista.

**Fix aplicado:**
1. Se hizo visible el indicador `#sync-note` (esquina inferior derecha, chico y discreto) — ahora sirve para confirmar de un vistazo, en cualquier momento, si un dispositivo sigue sincronizando.
2. Se agregó un **watchdog**: si pasan 3 minutos sin una sincronización exitosa (ninguna de las 3 vías -- Realtime, latido de 60s, poll de Fudo -- logró actualizar `orders`), la página se recarga sola (`location.reload()`). Es la misma solución que ya está en el protocolo manual de la Sección 6 del README operativo ("recargar la página"), pero automatizada, para no depender de que alguien lo note a tiempo.

**Nada de esto tocó el modelo de datos ni el flujo de Fudo** — es exclusivamente resiliencia del lado del cliente.

### 18/08/2026 (continuación 4) — Causa raíz real: el borrado automático nunca fue seguro, se sacó por completo (Ramiro)

El fix anterior (llevar el borrado real de 10 minutos a 24 horas) **no alcanzó**: el síntoma volvió a pasar con el pedido #653, confirmado de nuevo con SQL — la fila tenía un `id` distinto y un `created_at` nuevo, es decir, se había borrado y reimportado de verdad, solo ~27 minutos después de marcarse retirado (no 24hs).

**Causa raíz definitiva**: la limpieza de `orders` (`DELETE` de retirados vencidos) corre dentro de `loadAll()`, en el navegador de **cada dispositivo conectado**, no en un proceso central del servidor. Alcanza con que **un solo dispositivo** (una pestaña vieja del Panel de Control que no se recargó después de un deploy, por ejemplo) siga ejecutando una versión anterior del código para que ese dispositivo borre a los 10 minutos, sin importar que la Pantalla de Retiro ya tuviera la ventana de 24hs. Depender de que todos los dispositivos estén siempre en la misma versión del código, para que un borrado automático sea seguro, es frágil por diseño.

**Fix**: se sacó el `DELETE` automático de `loadAll()` por completo. Un pedido "retirado" deja de *mostrarse* a los 10 minutos (sin cambios ahí — sigue siendo solo un filtro en la lectura), pero la fila **ya no se borra sola nunca**. Esto elimina de raíz la posibilidad de que Fudo reimporte un pedido ya procesado, sin depender de qué versión de código tenga cada dispositivo.

**Por qué esto no genera un problema nuevo de crecimiento de la tabla**: al ritmo de pedidos de este local (cientos por día), la tabla `orders` crecería aproximadamente 30-40MB por año sin ningún borrado — muy por debajo del límite de 500MB del plan gratis de Supabase. No hace falta automatizar una limpieza a esta escala. Ver "Mantenimiento manual" más abajo para cuando (si alguna vez) haga falta.

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

## Mantenimiento manual (no urgente, sin botón en la app)

Desde el 18/08/2026, los pedidos "retirado" ya no se borran solos (ver Historial de cambios) — quedan guardados en `orders` para siempre, aunque dejen de mostrarse en pantalla a los 10 minutos. Al ritmo actual de pedidos, esto no requiere mantenimiento en años.

**A propósito, no hay un botón en el Panel de Control para borrar esto a mano.** Se evaluó y se descartó: es una acción destructiva (borra datos permanentemente) que hoy nadie necesita usar más que, como mucho, una vez cada varios meses — agregar un botón de borrado en una pantalla que usa el staff todos los días suma un riesgo de click accidental que no se justifica para algo tan infrecuente. Si en el futuro se vuelve algo que se necesita hacer seguido (mucho más volumen, más sucursales), ahí sí conviene reconsiderarlo.

Si alguna vez hace falta liberar espacio (por ejemplo, si esto escala a muchas sucursales compartiendo la misma base), correr esto en el SQL Editor de Supabase — borra solo los retirados más viejos que 90 días, dejando el resto intacto:

```sql
delete from public.orders
where estado = 'retirado' and ts_retirado < now() - interval '90 days';
```

## Seguridad — nota para quien retome esto

Las políticas de acceso (RLS) de las tablas `orders` y `promos` en Supabase son abiertas (`using (true) with check (true)`) — cualquiera con la clave pública del proyecto puede leer y escribir. Es una decisión consciente: no hay datos sensibles de clientes en estas tablas. Si esto escala a más sucursales o se agregan datos sensibles, hay que revisar estas políticas antes de continuar.

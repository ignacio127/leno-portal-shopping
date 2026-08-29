## KDS LENO — tablero de demoras (`kds.html`)

Página separada, para uso interno de gerencia y encargados. **No la ve el cliente ni la carga el TV del local**: es un archivo independiente que no toca `index.html` ni el flujo de la Pantalla de Retiro.

- **URL**: `https://ignacio127.github.io/leno-portal-shopping/kds.html`
- **Qué mide**: los tiempos que ya se venían guardando en `orders` sin usarse — `created_at` → `ts_listo` (preparación) y `ts_listo` → `ts_retirado` (retiro).
- **Cómo lee los datos**: `fetch` directo a la API REST de Supabase, trayendo solo cuatro columnas (`created_at`, `ts_listo`, `ts_retirado`, `estado`) y filtrando por fecha del lado del servidor. **Sin Realtime, sin polling, sin `select('*')`** — se carga solo cuando alguien toca "Actualizar" o cambia el período. Es una decisión deliberada después del incidente de Egress del 17/08/2026: esta página no puede generar tráfico de fondo.
- **Períodos**: 7, 14 o 30 días, más un selector de fechas libre. El rango incluye el día final completo.
- **Sin dependencias externas**: los logos de LENO y de Fudo van embebidos en base64 dentro del archivo, así que funciona igual abierto localmente o desde GitHub Pages, sin depender de `images/`. Los gráficos son CSS y SVG nativo, sin librerías.

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


- `kds.html`: tablero interno de demoras de preparación y retiro (ver más abajo). No lo usa el local, es para gerencia.

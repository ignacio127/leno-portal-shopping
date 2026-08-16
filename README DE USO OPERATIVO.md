# Pantalla de Retiro — Guía operativa para el local
### Sucursal Portal Shopping · LENO

*Última actualización: 16/08/2026*

Esta guía es para cualquier persona del local que necesite prender, usar o
destrabar la Pantalla de Retiro (el TV que muestra los números de pedido listos
para retirar). No requiere conocimientos técnicos.

---

## 1. Apertura diaria (situación normal)

El TV y la caja Android **quedan siempre enchufados**, las 24 horas. Al cerrar
el local, lo único que se apaga es el TV con el control remoto — la caja
Android sigue funcionando por dentro.

Por eso, para abrir un día normal:

1. Prender el TV con el control remoto.
2. La Pantalla de Retiro **debería aparecer sola**, tal cual quedó el día
   anterior — no hace falta repetir nada más.
3. **Si no aparece sola** (se ve el menú de Android, pantalla negra, "sin
   señal", o cualquier otra cosa que no sea la pantalla de LENO): pasar a la
   Sección 2 (apertura manual completa).

---

## 2. Apertura manual completa

Usar esta sección solo si la Pantalla de Retiro no aparece sola al prender el
TV (Sección 1), o después de un corte de luz real.

1. Verificar que la **caja Android** (el aparato conectado por HDMI al TV,
   separado del TV) esté encendida — tiene que verse su luz/led prendida.
   - **Si no responde:** desenchufar la fuente de alimentación de la caja
     (el cargador, no el cable HDMI), esperar **10 segundos**, volver a
     enchufarla, y esperar 30-60 segundos a que arranque.
2. Desde el menú principal (home) de la caja Android, entrar a **"Mis
   aplicaciones"**.
3. Abrir **Google Chrome**.
   - ⚠️ Tiene que ser Chrome específicamente. Se probaron otras opciones (el
     navegador que trae la caja de fábrica, un navegador tipo kiosko) y **no
     funcionaron** — solo Chrome instalado desde Play Store carga la página
     correctamente.
4. Dentro de Chrome, ir a **Favoritos** (ícono de estrella ⭐).
5. Tocar el favorito guardado de la Pantalla de Retiro
   (`https://ignacio127.github.io/leno-portal-shopping/`).
6. Esperar unos segundos a que cargue completo.
7. Activar pantalla completa: tocar el **ícono de flechas** que aparece abajo
   a la izquierda de la pantalla, al lado del ícono de la tuerca ⚙️.

---

### ⚠️ El salvapantallas de la caja Android

La caja Android trae de fábrica un salvapantallas configurado para activarse a
los **5 minutos**, que tapa la Pantalla de Retiro con un fondo genérico de
Android.

#### ✅ Solución aplicada — 16/08/2026 (en verificación)

Se activó el ajuste **"Pantalla siempre encendida al cargar"**, que mantiene la
pantalla despierta mientras la caja esté enchufada a la corriente — y está
enchufada las 24 horas. Probado en el local: **35 minutos sin que el
salvapantallas apareciera**, contra los 5 minutos que tardaba antes.

> **Por qué dice "en verificación":** intentos anteriores de corregir esto
> funcionaron al principio y después se desactivaron solos. Este ajuste está
> en un lugar distinto del sistema y tiene mejores chances de quedarse, pero
> **todavía no está confirmado**. Hasta el 30/08 hay que revisarlo (ver
> Sección 5).

#### Si el salvapantallas vuelve a aparecer

1. Desde la pantalla de inicio (home) de la caja Android, entrar a
   **Configuración**.
2. Entrar a **Preferencias del dispositivo**.
3. Entrar a **Opciones para desarrolladores**.
4. Buscar **"Pantalla siempre encendida al cargar"** y **activarlo**.
5. Volver a la Pantalla de Retiro y recargar la página.

> ⚠️ **Importante:** si al entrar el ajuste aparecía **desactivado**, avisarle a
> Ramiro con la fecha y la hora. Significa que la caja lo está reseteando sola
> y hay que resolverlo de otra manera.

---

## 3. Cómo saber que está funcionando bien

Cuando todo está en orden, la pantalla muestra:

- **Columna de turnos**: "Listo para retirar" y "En preparación", con el
  reloj y la fecha arriba.
- **Panel de publicidad** rotando al costado.
- Los pedidos nuevos **aparecen solos**, sin que nadie toque nada, a los
  pocos segundos de cargarse el pedido.

Si algo falla al cargar los datos, **el sistema mismo lo avisa**: aparece una
franja roja abajo de la pantalla con un mensaje de error. Está pensado para
que, sin saber nada de sistemas, alguien pueda sacarle una foto a esa franja
y mandarla — con eso alcanza para diagnosticar el problema a distancia (ver
Sección 7).

---

## 4. 📋 Registro de incidencias (obligatorio)

**Cada vez que la Pantalla de Retiro aparezca en negro, con el fondo de
Android, o trabada — anotar la hora y avisarle a Ramiro.**

Aunque después se arregle sola, aunque se resuelva recargando la página,
aunque haya durado dos minutos. **Igual hay que anotarlo.**

Anotar solamente estos tres datos:

| Fecha | Hora | Qué se veía |
|---|---|---|
| 16/08 | 14:30 | Fondo de Android |
| | | |

**Por qué importa:** sin este registro no hay forma de saber si las
correcciones que se aplican funcionan de verdad o solamente parece que sí.
Es el dato que decide si hay que cambiar el equipo o no. Lleva 10 segundos
anotarlo.

---

## 5. 🔍 Revisión periódica (hasta el 30/08/2026)

Mientras la solución del salvapantallas esté **en verificación**, el encargado
de turno tiene que revisar **una vez por semana** que el ajuste siga activo:

1. Configuración → Preferencias del dispositivo → Opciones para
   desarrolladores.
2. Verificar que **"Pantalla siempre encendida al cargar"** siga **activado**.
3. Avisarle a Ramiro el resultado — **tanto si está bien como si no**.

| Fecha de revisión | ¿Seguía activado? | Quién revisó |
|---|---|---|
| | | |
| | | |
| | | |

Si el 30/08 el ajuste siguió activo todas las semanas, el problema queda
cerrado y esta sección se elimina de la guía.

---

## 6. Panel de control (uso diario, marcar pedidos)

1. Tocar el ícono de la **tuerca ⚙️** abajo a la izquierda de la pantalla de
   retiro. Ahí se abre el Panel de Control.
2. Pestaña **"Pedidos"**: acá se marcan los pedidos como **"Listo"** o
   **"Retirado"**.
3. Pestaña **"Publicidad"**: acá se cargan o desactivan las promos que rotan
   en la pantalla.
4. Para volver a la pantalla de retiro (la que ven los clientes): botón **"Ver
   pantalla de retiro"** arriba del panel.

### ¿Por qué "Marcar listo" es manual y no automático?

Porque el sistema de pedidos (Fudo) **no tiene forma de avisar solo** cuándo
un pedido de mostrador está listo — se probó a fondo y no existe ese dato
disponible del lado de Fudo para pedidos de mostrador. Por eso, alguien de
cocina o mostrador tiene que tocar el botón "Listo" a mano en el Panel de
Control cuando corresponda. **No es una falla del sistema — es cómo está
diseñado a propósito.**

---

## 7. Qué hacer ante una falla — pasos en orden

Seguir en este orden. No saltear pasos ni repetir el mismo paso varias veces
esperando un resultado distinto.

1. **Recargar la página** (botón de recargar de Chrome, o deslizar hacia
   abajo en la pantalla).
2. Si sigue igual: **cerrar Chrome completamente y volver a abrirlo**
   siguiendo la Sección 2.
3. Si sigue igual: **reiniciar la caja Android** (desenchufar la fuente 10
   segundos, volver a enchufar, esperar que arranque).
4. Si aparece la **franja roja de error**: sacar una foto de la pantalla
   completa (que se lea bien el texto) y enviarla al contacto de la Sección
   9. No hace falta entender el mensaje, alcanza con la foto.
5. **Anotar la incidencia** (Sección 4) — siempre, se haya resuelto o no.
6. **Mientras se resuelve el problema (protocolo de respaldo):**
   - Usar los **beepers del local** para avisar los pedidos. Si en ese
     momento no están disponibles (sin batería, en uso, etc.), **anunciar
     los números de turno en voz alta** como alternativa.
   - **Comunicarse con Ramiro por teléfono**, informando la situación.

---

## 8. Cierre del local

- El TV **y** la caja Android quedan enchufados toda la noche — no se
  desenchufa nada al cerrar.
- Al cerrar, apagar **solo el TV** con el control remoto.
- Al otro día, alcanza con prender el TV de nuevo (Sección 1) — la caja
  Android sigue corriendo por dentro y la Pantalla de Retiro debería aparecer
  tal cual quedó.

---

## 9. Preguntas frecuentes

**El TV está negro, no prende nada.**
Revisar si el control remoto tiene pilas y si el TV está enchufado. Revisar
si la caja Android tiene su luz encendida — si no, revisar que la fuente
esté bien enchufada en los dos extremos.

**Prendí el TV y no aparece la Pantalla de Retiro, aparece el menú de
Android u otra cosa.**
Seguir la Sección 2 (apertura manual completa).

**Chrome abre pero dice "sin conexión" o no carga la página.**
Revisar si el wifi/internet del local está funcionando en otros equipos. Si
funciona en otros lados y ahí no, reiniciar la caja Android (Sección 7, paso
3).

**La pantalla se queda "pegada" con los mismos turnos de hace rato, no entran
pedidos nuevos.**
Recargar la página primero (Sección 7, paso 1). El sistema se actualiza
solo; si no se mueve por más de 1-2 minutos con pedidos entrando en Fudo,
probablemente se cortó la conexión y con recargar se resuelve.

**Un pedido de mostrador aparece como "Pedido de Mostrador - $X" en vez del
nombre de la hamburguesa.**
Es normal y conocido: Fudo no envía el detalle del producto para estos
pedidos, solo el monto. No es un error de la pantalla, no hace falta hacer
nada.

**Un pedido ya se le entregó al cliente pero sigue apareciendo como "Listo".**
No desaparece solo — hay que entrar al Panel de Control (⚙️) y marcarlo como
**"Retirado"** a mano.

**Las imágenes de publicidad se quedan trabadas en una sola, no rotan.**
Recargar la página primero. Si sigue igual, puede ser que falte cargar más
de una promo activa desde el Panel de Control → pestaña Publicidad.

**Se cortó la luz del local, ¿qué hago cuando vuelve?**
Seguir la Sección 2 (apertura manual completa) desde cero — un corte real de
luz sí requiere repetir todos los pasos, a diferencia de una apertura normal
(Sección 1).

**¿Tengo que tocar algo mientras la pantalla está mostrando los turnos a los
clientes?**
No. Se actualiza sola. Solo entrar al Panel de Control (⚙️) cuando haya que
marcar un pedido como Listo/Retirado o cargar una promo nueva.

**Veo el salvapantallas o el fondo de pantalla de Android en vez de los
turnos.**
Desde el 16/08/2026 hay una solución aplicada (ajuste "Pantalla siempre
encendida al cargar"), pero todavía está en verificación. Si igual aparece:
Configuración → Preferencias del dispositivo → Opciones para desarrolladores
→ activar **"Pantalla siempre encendida al cargar"**. Después recargar la
Pantalla de Retiro, **anotar la incidencia (Sección 4) y avisarle a Ramiro**.

**¿A quién aviso si ninguno de estos pasos resuelve el problema?**
Ver Sección 10.

---

## 10. Escalamiento

| Nivel | Quién | Cuándo |
|---|---|---|
| 0 | Encargado de turno | Revisión semanal del ajuste de pantalla (Sección 5), hasta el 30/08/2026 |
| 1 | Encargado de turno | Cualquier falla — seguir la Sección 7 primero |
| 2 | Ramiro (LENO SRL) | Si los pasos de la Sección 7 no resuelven el problema, o si el ajuste de pantalla apareció desactivado |

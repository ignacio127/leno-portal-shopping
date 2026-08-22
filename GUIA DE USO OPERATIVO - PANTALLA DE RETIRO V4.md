# Pantalla de Retiro — Guía operativa para el local
### Sucursal Portal Shopping · LENO

Esta guía es para cualquier persona del local que necesite prender, usar o
destrabar la Pantalla de Retiro (el TV que muestra los números de pedido listos
para retirar). No requiere conocimientos técnicos.

> **Versión 22/08/2026.** Cambió la apertura diaria: ahora la pantalla arranca
> con un cartel rojo que hay que tocar. Ver Sección 1.

---

## 1. Apertura diaria (situación normal)

El TV y la caja Android **quedan siempre enchufados**, las 24 horas. Al cerrar
el local, lo único que se apaga es el TV con el control remoto — la caja
Android sigue funcionando por dentro.

Por eso, para abrir un día normal:

1. Prender el TV con el control remoto.
2. La Pantalla de Retiro **debería aparecer sola**, tal cual quedó el día
   anterior.
3. **Si aparece un cartel rojo con el logo de LENO que dice "TOCAR PARA
   INICIAR": tocar la pantalla una vez.** El cartel desaparece y los turnos
   quedan a pantalla completa. Eso es todo.
4. **Si no aparece nada de LENO** (se ve el menú de Android, pantalla negra,
   "sin señal", o cualquier otra cosa): pasar a la Sección 2 (apertura manual
   completa).

### El cartel rojo "TOCAR PARA INICIAR"

Es normal y está puesto a propósito. Aparece cada vez que la página se carga
de cero: al prender el TV, después de un corte de luz, o si el sistema se
recarga solo para destrabarse.

**Qué hace el toque:** pone la pantalla en modo completo, sin la barra de
direcciones de Chrome arriba. Esa barra ocupa lugar y, sobre todo, **se puede
tocar sin querer y sacar la pantalla del sitio de LENO** — con el cartel eso
deja de pasar.

**Tiene que tocarlo una persona.** No se puede automatizar: el navegador solo
permite pasar a pantalla completa cuando alguien toca de verdad. Por eso es el
primer paso de la apertura.

**Si nadie lo toca**, el cartel se va solo al minuto y los turnos se ven
igual — nunca queda tapando la pantalla. Lo único que se pierde es el modo
completo: va a quedar la barra de direcciones a la vista arriba. Si en algún
momento del día se ve esa barra, alcanza con recargar la página y tocar el
cartel cuando aparezca.

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
7. Cuando aparezca el **cartel rojo "TOCAR PARA INICIAR"**, tocar la pantalla
   una vez. Con eso queda en pantalla completa.
   - Si el cartel ya se fue (pasó más de un minuto), recargar la página y
     esperar a que vuelva a aparecer.
   - También sirve el **ícono de flechas** abajo a la izquierda, al lado de la
     tuerca ⚙️ — hace lo mismo, pero el cartel es más difícil de pasar por
     alto.

### Si el salvapantallas vuelve a aparecer

La caja Android trae de fábrica un salvapantallas que se activa cada **5
minutos** y tapa la Pantalla de Retiro. **El ajuste que lo resuelve ya está
aplicado desde el 16/08/2026 y viene funcionando.**

Igual puede volver a aparecer, porque todavía no sabemos si la caja mantiene
ese ajuste o lo resetea sola con el tiempo. Si pasa, corregir así:

1. Desde la pantalla de inicio (home) de la caja Android, entrar a
   **Configuración**.
2. Entrar a **Preferencias del dispositivo**.
3. Entrar a **Opciones para desarrolladores**.
4. Buscar **"Pantalla siempre encendida al cargar"** y activarlo.
5. Volver a la Pantalla de Retiro y recargar la página.

> **Importante: si al entrar el ajuste ya aparecía desactivado, avisarle a
> Ramiro con la fecha y la hora.** No es un detalle: significa que la caja lo
> está reseteando sola, y ese dato es el que define si hay que cambiar el
> equipo. Sin ese aviso el problema no se puede terminar de resolver.

---

## 3. Cómo saber que está funcionando bien

Cuando todo está en orden, la pantalla muestra:

- **Nada de Chrome arriba**: ni barra de direcciones, ni botones del
  navegador. Solo la pantalla de LENO, de borde a borde. Si se ve la
  dirección `ignacio127.github.io...` arriba, falta tocar el cartel rojo
  (Sección 1).
- **Columna de turnos**: "Listo para retirar" y "En preparación", con el
  reloj y la fecha arriba.
- **Panel de publicidad** rotando al costado.
- Los pedidos nuevos **aparecen solos**, sin que nadie toque nada, a los
  pocos segundos de cargarse el pedido.

Si algo falla al cargar los datos, **el sistema mismo lo avisa**: aparece una
franja roja abajo de la pantalla con un mensaje de error. Está pensado para
que, sin saber nada de sistemas, alguien pueda sacarle una foto a esa franja
y mandarla — con eso alcanza para diagnosticar el problema a distancia (ver
Sección 6).

---

## 4. Panel de control (uso diario, marcar pedidos)

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

## 5. Cierre del local

- El TV **y** la caja Android quedan enchufados toda la noche — no se
  desenchufa nada al cerrar.
- Al cerrar, apagar **solo el TV** con el control remoto.
- Al otro día, alcanza con prender el TV de nuevo (Sección 1) — la caja
  Android sigue corriendo por dentro y la Pantalla de Retiro debería aparecer
  tal cual quedó.

---

## 6. Qué hacer ante una falla — pasos en orden

Seguir en este orden. No saltear pasos ni repetir el mismo paso varias veces
esperando un resultado distinto.

1. **Recargar la página** (botón de recargar de Chrome, o deslizar hacia
   abajo en la pantalla). Al recargar va a aparecer el cartel rojo "TOCAR
   PARA INICIAR" — tocarlo para volver a pantalla completa.
2. Si sigue igual: **cerrar Chrome completamente y volver a abrirlo**
   siguiendo la Sección 2.
3. Si sigue igual: **reiniciar la caja Android** (desenchufar la fuente 10
   segundos, volver a enchufar, esperar que arranque).
4. Si aparece la **franja roja de error**: sacar una foto de la pantalla
   completa (que se lea bien el texto) y enviarla al contacto de la Sección
   8. No hace falta entender el mensaje, alcanza con la foto.
5. **Mientras se resuelve el problema (protocolo de respaldo):**
   - Usar los **beepers del local** para avisar los pedidos. Si en ese
     momento no están disponibles (sin batería, en uso, etc.), **anunciar
     los números de turno en voz alta** como alternativa.
   - **Comunicarse con Ramiro por teléfono**, informando la situación.

---

## 7. Preguntas frecuentes

**El TV está negro, no prende nada.**
Revisar si el control remoto tiene pilas y si el TV está enchufado. Revisar
si la caja Android tiene su luz encendida — si no, revisar que la fuente
esté bien enchufada en los dos extremos.

**Prendí el TV y no aparece la Pantalla de Retiro, aparece el menú de
Android u otra cosa.**
Seguir la Sección 2 (apertura manual completa).

**Chrome abre pero dice "sin conexión" o no carga la página.**
Revisar si el wifi/internet del local está funcionando en otros equipos. Si
funciona en otros lados y ahí no, reiniciar la caja Android (Sección 6, paso
3).

**La pantalla se queda "pegada" con los mismos turnos de hace rato, no entran
pedidos nuevos.**
Recargar la página primero (Sección 6, paso 1). El sistema se actualiza
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
Ir a Configuración → Preferencias del dispositivo → Opciones para
desarrolladores y activar **"Pantalla siempre encendida al cargar"**. Después,
recargar la Pantalla de Retiro. Los pasos completos están en la Sección 2. Si
el ajuste ya estaba desactivado cuando entraste, avisarle a Ramiro con la
fecha y la hora.

**Aparece un cartel rojo con el logo de LENO que dice "TOCAR PARA INICIAR".
¿Está roto?**
No. Es normal y está puesto a propósito. Tocar la pantalla una vez y sigue
todo como siempre. Ver Sección 1.

**Se ve la dirección de internet (`ignacio127.github.io...`) arriba de la
pantalla.**
Falta el paso de pantalla completa. Recargar la página y tocar el cartel rojo
cuando aparezca. Si pasa seguido en el mismo día, avisar a Ramiro con la hora
aproximada: significa que la pantalla se está recargando sola y eso es un
dato útil.

**Toqué el cartel rojo y volvió a aparecer al rato.**
Quiere decir que la pantalla salió del modo completo por algo. Tocarlo de
nuevo. Si vuelve a pasar más de dos veces en el mismo día, anotarlo y avisar
a Ramiro.

**El cartel rojo desapareció solo sin que nadie lo tocara.**
Es lo previsto: se va al minuto para no tapar los turnos. Los pedidos se ven
igual, pero queda la barra de Chrome arriba. Recargar y tocarlo cuando se
pueda.

**¿A quién aviso si ninguno de estos pasos resuelve el problema?**
Ver Sección 8.

---

## 8. Escalamiento

| Nivel | Quién | Cuándo |
|---|---|---|
| 1 | Encargado de turno | Cualquier falla — seguir la Sección 6 primero |
| 2 | Ramiro (LENO SRL) | Si los pasos de la Sección 6 no resuelven el problema |

---

## 9. Historial de cambios de esta guía

| Fecha | Cambio |
|---|---|
| 22/08/2026 | Nueva capa de inicio en pantalla completa. Cambia la Sección 1 (apertura diaria): ahora hay que tocar el cartel. Se agregaron 4 preguntas frecuentes y una señal de control en la Sección 3. |
| 22/08/2026 | Se corrigió el procedimiento del salvapantallas (Sección 2 y preguntas frecuentes): el ajuste correcto está en Opciones para desarrolladores, no en el menú de Salvapantallas. La versión anterior de esta guía mandaba al menú equivocado. |

---

### Qué anotar y pasarle a Ramiro

Estos cuatro datos no se pueden ver a distancia y son los que definen si hace
falta cambiar la caja Android. Anotarlos en el cuaderno del local con **fecha
y hora**:

1. Días en que, al prender el TV, **no** apareció el cartel rojo ni la
   pantalla de LENO.
2. Veces que el cartel rojo volvió a aparecer solo durante el día.
3. Veces que se vio la barra de direcciones de Chrome arriba en pleno
   servicio.
4. Veces que el ajuste **"Pantalla siempre encendida al cargar"** apareció
   desactivado. Este es el dato que define si hay que cambiar la caja Android.

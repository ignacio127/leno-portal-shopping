# STATE — leno-portal-shopping

Última actualización: 29/10/2026 (ART)

## Qué es
Pantalla de retiro de pedidos de LENO, con un carrusel de promos. La página está en este repo y los datos vienen de Supabase.

## Componentes
- **Supabase**: el proyecto «leno-portal-shopping», en la cuenta leno-food.
  - **Edge function `fudo-pedidos`**: trae los pedidos desde la API de Fudo y hace upsert en la tabla `orders`.
    - Se despliega con `--no-verify-jwt`, porque la pantalla la llama sin JWT. No hay que activar verify_jwt.
  - **Tabla `public.promos`**: guarda las promos del carrusel.
    - Columnas: id, nombre, precio, tag, descripcion, icon, destacado, activo, image_url, full_image, created_at.
- **Imágenes de promos**: se sirven desde la carpeta `images/` del repo, con rutas relativas (`./images/...`), no desde Supabase Storage.

## Promos activas
| id | nombre | precio | imagen |
|---|---|---|---|
| p-bucket | Bucket | $24.500 | ./images/bucket-24000.jpg |
| p-lenit | LEN IT Burger | $16.800 | ./images/lenit-16800.jpeg |

Las dos están activas y destacadas, y el carrusel rota entre ellas.

## Estado de logs y cuota
- Desde el 17/08 había dos `console.log` de diagnóstico en `fudo-pedidos`, que generaban unos 42 MB por día de logs.
- El 29/10, a las 11:02, se desplegó la versión 11 sin esos logs. Se verificó que responde 200, que la pantalla anda y que el upsert de `orders` funciona.
- El uso de cuota del ciclo es acumulado: no va a bajar, solo debería dejar de crecer rápido. El 30/10 a las 10:00 se mide el efecto.

## Pendiente (requiere OK de Ramiro)
- Paso 2: polling cada 20 s y upsert solo de los cambios.
- Opcional: un log corto solo de errores.

## Reglas
- No se toca producción, ni claves ni datos sin el OK de Ramiro.
- Los secretos van solo en GitHub Secrets o en los secrets de Supabase, nunca en el repo.
- Para nombrar una imagen nueva, se usa el nombre exacto con que quedó en el repo, extensión incluida.

# fudo-pedidos

Proxy entre la pantalla de retiro y la API de Fudo. El navegador llama a esta función; ella consulta los pedidos de mostrador y devuelve solo `pedidos` (id, estado, cliente, total, fecha y detalle). El token de Fudo no sale de Supabase.

La pantalla llama a la función sin JWT, así que se despliega con `--no-verify-jwt` (`verify_jwt` queda en false).

## Si Fudo no responde

El login a `auth.fu.do` corta a los 5 segundos. La consulta de ventas a `api.fu.do` corta a los 10 segundos. Ante timeout, error de red, HTTP no exitoso o JSON inválido, la función responde **503**:

```json
{ "error": "fudo_no_disponible", "paso": "ventas", "tipo": "timeout", "desde": "2026-11-22T12:00:00.000Z" }
```

- `paso`: `login`, `ventas` o `parseo`.
- `tipo`: `timeout`, `red`, `http` o `json`.
- `desde`: hora ISO del primer fallo de la racha actual en ese worker. Una respuesta 200 corta la racha. Es memoria del worker, no un reloj global de todos los workers.

El cuerpo crudo de Fudo no se reenvía. Un error inesperado nuestro responde **500** `{ "error": "error_interno" }`.

Cada fallo deja un `console.error` de una sola línea JSON (`paso`, `tipo`, `status` si hubo HTTP, `ms`, `mensaje` de hasta 150 caracteres). Como máximo uno por minuto por worker; si se descartan, el siguiente dice cuántos en `suprimidos`. Ese log no incluye el token, ni `FUDO_API_KEY`, ni `FUDO_API_SECRET`, ni headers, ni el cuerpo del login.

Si el login falla, se tira el token cacheado. Si ventas responde 401, se tira el token y se reintenta una sola vez.

La query, el formato de `pedidos` y el CORS quedan iguales que en la v11.

## Secretos

`FUDO_API_KEY` y `FUDO_API_SECRET` se configuran en los secrets de Supabase. No van en este repo, ni en GitHub, ni en el navegador.

## URLs solo para pruebas locales

Por defecto la función usa `https://auth.fu.do/api` y `https://api.fu.do/v1alpha1`. `FUDO_AUTH_URL` y `FUDO_BASE_URL` permiten apuntar a un Fudo falso en la máquina. **En producción no se setean.** Si quedaran definidas, la pantalla dejaría de hablar con Fudo.

## Cómo probarlo

```bash
deno test --allow-env --allow-net supabase/functions/fudo-pedidos/index_test.ts
deno check supabase/functions/fudo-pedidos/index.ts
deno lint supabase/functions/fudo-pedidos/index.ts supabase/functions/fudo-pedidos/index_test.ts
```

## Deploy manual

Con la CLI de Supabase, el proyecto ya linkeado y los secrets ya cargados:

```bash
supabase functions deploy fudo-pedidos --no-verify-jwt
```

No hace falta volver a cargar los secrets si no cambiaron. No setear `FUDO_AUTH_URL` ni `FUDO_BASE_URL`.

## Volver atrás

La versión anterior es la v11, en la rama `fudo-pedidos-v11` (el código que ya está en producción desde el 29/10/2026). Para volver:

```bash
supabase functions deploy fudo-pedidos --no-verify-jwt
```

usando ese código, no este. El deploy no toca los secrets ni la pantalla.

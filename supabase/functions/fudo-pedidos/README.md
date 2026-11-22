# fudo-pedidos

Proxy entre la pantalla de retiro y la API de Fudo. El navegador llama a esta función; ella consulta los pedidos de mostrador y devuelve solo `pedidos` (id, estado, cliente, total, fecha y detalle). El token de Fudo no sale de Supabase.

Esta carpeta es la versión 11, la que está en producción desde el 29/10/2026 (desplegada con `--no-verify-jwt`). El código está copiado tal cual, sin cambios.

## Secretos

`FUDO_API_KEY` y `FUDO_API_SECRET` se configuran en los secrets de Supabase. No van en este repo, ni en GitHub, ni en el navegador.

## Deploy manual

Desde una máquina con la CLI de Supabase, el proyecto ya linkeado y los secrets ya cargados:

```bash
supabase functions deploy fudo-pedidos --no-verify-jwt
```

`verify_jwt` queda en false porque la pantalla llama a la función sin JWT. No hay que activarlo.

## Volver atrás

Para volver a esta versión, hacer checkout de este código y desplegar de nuevo con el mismo comando:

```bash
supabase functions deploy fudo-pedidos --no-verify-jwt
```

No cambia los secrets ni la pantalla.

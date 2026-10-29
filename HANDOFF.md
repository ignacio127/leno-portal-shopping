# HANDOFF — leno-portal-shopping
Este archivo es solo para agregar: no se edita ni se borra lo anterior. Cada entrada nueva va al final.

## 29/10/2026 — LunAI (Grok Bot)
1. **Auditoría de logs.** El exceso de cuota venía de dos `console.log` de diagnóstico en `fudo-pedidos`: el bloque DIAGNOSTICO TEMPORAL y `FUDO_RAW_SAMPLE`. Estaban activos desde el 17/08.
2. **Paso 1, aprobado.** Se desplegó la versión 11 de `fudo-pedidos` sin esos logs y con `--no-verify-jwt`, a las 11:02. Se verificó que responde 200, que no hay 401 ni 500, que la pantalla está OK y que el upsert de `orders` sigue funcionando.
3. **Medición.** Hay una medición única programada para el 30/10 a las 10:00, que compara los logs contra la base de unos 42 MB por día.
4. **Promo Bucket, aprobada (opción 2).** La imagen apuntaba a `bucket-24500.jpg`, que ya no existía. Se corrigió el `image_url` a `./images/bucket-24000.jpg` y el precio sigue en $24.500.
5. **Promo LEN IT Burger, aprobada.** Ramiro subió `images/lenit-16800.jpeg` y se insertó la promo `p-lenit`:
   - precio $16.800 y tag «Stock limitado»;
   - destacada, activa y con imagen completa (full_image);
   - la imagen responde 200.

**Próximo paso:** revisar el resultado de la medición del 30/10 y decidir si se hace el paso 2.

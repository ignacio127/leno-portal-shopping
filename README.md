# LENO Portal Shopping — Pantalla de Retiro (demo)

Prototipo de la pantalla de retiro + panel de control para LENO Portal Shopping.

## Qué es esto

- `index.html`: la app completa (pantalla de retiro para el cliente + panel de control para el local), en un solo archivo, sin backend.
- Guarda los datos en el navegador (`localStorage`): sincroniza entre pestañas del **mismo** navegador, no entre dispositivos distintos. Es una demo para mostrar, no la versión para operar el local todos los días.

## Cómo se usa

- **Pantalla de Retiro**: se abre por defecto — turnos listos, en preparación, y el panel de publicidad rotando.
- **Panel de Control**: ícono de engranaje abajo a la izquierda de la Pantalla de Retiro. Ahí se agregan pedidos, se marcan como listos/retirados, y se carga o desactiva contenido de publicidad (con imagen, subiendo un archivo o pegando un link de Google Drive).

## Fuentes de marca (opcional)

Hoy usa Anton (para títulos) y Montserrat (para texto) como reemplazo de las fuentes reales de LENO. Para que se vea con las fuentes reales — Morganite y Argentum Sans, ambas gratuitas para uso comercial — subí estos dos archivos a una carpeta `/fonts/` en este mismo repo, con estos nombres exactos:

- `fonts/Morganite-Black.woff2`
- `fonts/ArgentumSans-Regular.woff2`

Si no los subís, no rompe nada — sigue funcionando con las fuentes de reemplazo.

## Pendiente para pasar de demo a producción

1. Reemplazar `localStorage` por un backend compartido (Firebase o Supabase), para que la pantalla y el panel se sincronicen entre dispositivos distintos.
2. Confirmar con la API de Fudo (ya activada) si el campo `saleState` de un pedido de Mostrador pasa solo a `READY-TO-DELIVER`, o si requiere un paso manual — antes de conectar el botón de "listo" a la API en vez de que lo apriete una persona.

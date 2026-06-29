# Herramienta AR — archivos para copiar y reemplazar

Copia cada archivo a la misma ruta dentro de tu proyecto (respetan tu estructura actual). Los marcados como NUEVO no existían; los demás reemplazan al actual.

## 1. Base de datos (correr UNA vez en el SQL Editor de Supabase)
- `database/07-migration-ar-tool.sql` — NUEVO. Agrega medidas (width/height/depth_cm) a `product`, hace price/stock opcionales, crea la tabla `model_view` y la función `increment_model_view`. Ejecútalo después de tus migraciones 01–06.

## 2. Backend (server)
- `server/src/services/embed.service.js` — NUEVO. Lee el modelo público e incrementa vistas.
- `server/src/controllers/embed/embed.controller.js` — NUEVO.
- `server/src/router/embed.router.js` — NUEVO.
- `server/src/app.js` — REEMPLAZA. Monta `embedRouter` en `/api`.
- `server/src/services/product.service.js` — REEMPLAZA. Incluye medidas y vistas en el shape, y en create/update.
- `server/src/controllers/customer/seller-product.controller.js` — REEMPLAZA. Acepta medidas; price/stock opcionales.
- `server/src/middlewares/upload.middleware.js` — REEMPLAZA. Acepta `.usdz` además de `.glb`.

## 3. Frontend (client)
- `client/src/services/seller/embedService.js` — NUEVO. Llamadas a los endpoints embed.
- `client/src/pages/EmbedViewer.jsx` — NUEVO. Página desnuda fullscreen del visor AR (ruta `/ver/:id`).
- `client/src/routes.jsx` — REEMPLAZA. Agrega la ruta `/ver/:id`.
- `client/src/components/seller/SellerProducts.jsx` — REEMPLAZA. Form con medidas + USDZ, y cada producto muestra el código del iframe (botón copiar) y las vistas.
- `client/src/components/seller/SellerForms.module.css` — REEMPLAZA. Tu CSS actual + estilos del bloque embed.

## Endpoints nuevos
- `GET  /api/embed/:id` — datos públicos del modelo (nombre, URL .glb, medidas).
- `POST /api/embed/:id/view` — suma +1 a las vistas.

## El embed que copia el vendedor
```html
<iframe src="https://TU-APP.vercel.app/ver/[ID]" width="100%" height="500"
  style="border:0;" allow="camera; xr-spatial-tracking" allowfullscreen></iframe>
```
La URL base se toma sola de `window.location.origin`, así que el código generado ya apunta a tu dominio de Vercel.

## Notas
- El escalado real en AR usa la altura (cm) sobre el tamaño nativo del .glb. Probar temprano con una caja de medida conocida (30 cm) para confirmar.
- `model-viewer` ya está instalado (`@google/model-viewer` en `main.jsx`); el visor nuevo lo reutiliza.
- USDZ se sube y almacena; `model-viewer` lo usa para Quick Look en iPhone. Para máxima compatibilidad, lo ideal es subir GLB (Android/escala) y, si se quiere, USDZ para iOS.
- Login/registro de vendedor y `becomeSeller` no se tocan: ya exigen solo `storeName` (lo demás es opcional).
- Shopify (punto 8) queda fuera, como acordado.

# Shopify Etapa 3 — Asociar modelo AR <-> producto Shopify

Cada producto de la lista (Etapa 2) gana un botón "Asignar AR" que abre un modal
para: reusar un modelo .glb ya subido O subir uno nuevo, con medidas (cm). La
relación se guarda en Supabase. Los productos con modelo muestran un badge.

## Archivos (descomprime en la raíz, sobrescribe)

BACKEND:
- server/src/services/shopify-assign.service.js              (NUEVO)
- server/src/controllers/shopify/shopify-assign.controller.js (NUEVO)
- server/src/router/shopify.router.js                        (MOD: +rutas Etapa 3)

FRONTEND:
- client/src/services/shopify/shopifyService.js              (MOD: +funciones assign)
- client/src/components/seller/ShopifyAssignModal.jsx        (NUEVO)
- client/src/components/seller/SellerShopify.jsx             (MOD: +botón/badge/modal)

BASE DE DATOS:
- database/09-migration-shopify-product-model.sql            (NUEVA — DEBES CORRERLA)

## PASO OBLIGATORIO: correr la migración

En el SQL Editor de Supabase, ejecuta el contenido de
database/09-migration-shopify-product-model.sql. Crea la tabla
shopify_product_model. Sin esto, "Asignar AR" dará error 500.

## Nuevos endpoints (todos con cookie de cliente)

GET  /api/customer/models                   -> modelos para reusar
GET  /api/customer/shopify/assignments      -> { shop, assignments: {gid:{...}} }
POST /api/customer/shopify/assign           -> asigna modelo + medidas a un GID
POST /api/customer/shopify/unassign         -> quita la asignación

(unassign es POST, no DELETE, porque el apiDelete del cliente no manda body.)

## Pasos

1. Descomprime sobre la raíz. Sobrescribe los 6.
2. CORRE la migración 09 en Supabase.
3. Verifica local:
       cd client; npm run build
       cd ../server; node --check src/router/shopify.router.js
4. Commit + push.
5. Probar: /vender -> Shopify. Cada producto tiene "Asignar AR".
   a. Click en uno -> modal.
   b. "Subir nuevo": elige un .glb, pon medidas (ej. 30/45/30), Guardar.
      O "Reusar modelo": elige uno de la lista, medidas, Guardar.
   c. La tarjeta ahora muestra badge "AR: <nombre>".
   d. Verifica en Supabase:
        SELECT shopify_product_gid, product_title, model_id, width_cm
        FROM shopify_product_model;

## Notas

- Los modelos son globales (la tabla "model" no tiene seller_id). "Reusar"
  lista TODOS los modelos del sistema. Para tu escala está bien; si luego
  quieres modelos por vendedor, hay que añadir seller_id a "model".
- El .glb se sube al endpoint existente /customer/seller/models (reuso, sin
  duplicar el pipeline de Storage).

## Siguiente: Etapa 4 — Theme App Extension (inyectar el visor sin copy-paste).

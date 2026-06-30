# Shopify Etapa 2 — Leer catálogo (Admin GraphQL API)

Lista los productos reales de la tienda Shopify conectada, en el panel del
vendedor (pestaña Shopify, debajo del botón de conexión).

## Archivos (descomprime en la raíz del repo, sobrescribe)

BACKEND:
- server/src/services/shopify-admin.service.js              (NUEVO)
- server/src/controllers/shopify/shopify-products.controller.js  (NUEVO)
- server/src/router/shopify.router.js                       (MOD: +ruta products)

FRONTEND:
- client/src/services/shopify/shopifyService.js             (NUEVO)
- client/src/components/seller/SellerShopify.jsx            (MOD: +listado)

BASE DE DATOS:
- database/08-migration-shopify.sql   (CORREGIDO: FK a customer, no user)
  Ya aplicaste el fix manualmente con un ALTER. Este archivo solo deja el
  repo consistente para instalaciones limpias. NO necesitas correrlo otra vez.

## Nuevo endpoint

GET /api/customer/shopify/products   (protegido, cookie de cliente)
-> { shop, products: [{ id, title, handle, status, inventory, image, price, currency }] }

El id es el GID de Shopify (gid://shopify/Product/123...). Lo necesitarás en la
Etapa 3 para asociar el modelo AR al producto.

## Pasos

1. Descomprime sobre la raíz. Sobrescribe los 5 (+ el SQL).
2. Verifica local:
       cd client; npm run build
       cd ../server; node --check src/router/shopify.router.js
3. Commit + push. Vercel redeploya.
4. Probar: /vender -> pestaña Shopify. Como ya conectaste hublab-test, debería
   cargar y mostrar los productos de prueba de esa tienda (gift card, jabón,
   snowboards, etc.) en tarjetas.

## Si el listado falla

- "Shopify respondió 401/403": el token no tiene permiso de lectura. Reinstala
  la app (botón Reconectar) para refrescar scopes. (Tu fila mostraba scope
  "write_products"; si lectura falla, este es el motivo y el fix.)
- "No tienes ninguna tienda conectada" (y sí conectaste): revisa que el
  seller_id de la fila en shopify_store coincida con el customer logueado.
- Lista vacía: la tienda no tiene productos (improbable, los de prueba existen).

## Siguiente: Etapa 3 — asociar modelo AR <-> producto Shopify.

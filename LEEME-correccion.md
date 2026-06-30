# Shopify Etapa 1 — CORRECCIÓN + UI

Este paquete corrige un bug del paquete anterior y añade el botón en el panel.

## Por qué la corrección

El panel de vendedor usa la sesión de CLIENTE (cookie `customer-token`,
middleware `customerAuth`, `req.customer`). El paquete anterior protegía
/api/shopify/auth con el middleware de ADMIN (`auth`, `auth-token`, `req.user`),
que un vendedor no tiene. Resultado: el OAuth habría dado 401 al vendedor real.

Corregido: ahora usa `customerAuth` y lee `req.customer.id`.

## Archivos (descomprime en la raíz del repo, sobrescribe)

BACKEND (corregidos):
- server/src/router/shopify.router.js          (usa customerAuth)
- server/src/controllers/shopify/shopify.controller.js   (req.customer.id)

FRONTEND (nuevos/modificados):
- client/src/components/seller/SellerShopify.jsx   (NUEVO: botón conectar)
- client/src/pages/SellerDashboard.jsx             (MOD: +tab "Shopify")

## Pasos

1. Descomprime sobre la raíz. Sobrescribe los 4.
2. Commit + push. Vercel redeploya server y client.
3. Probar el flujo COMPLETO:
   a. Loguéate en el frontend como un vendedor (cuenta con isSeller).
   b. Ve a /vender -> pestaña "Shopify".
   c. Escribe: hublab-test.myshopify.com -> "Conectar tienda".
   d. Te lleva a Shopify -> pantalla de permisos -> Instalar.
   e. Vuelve a /vender?shopify=connected&shop=... con mensaje verde.
   f. Verifica en Supabase: tabla shopify_store tiene una fila con
      access_token y seller_id = tu id de vendedor.

## Si falla

- 401 al conectar: no estabas logueado como vendedor, o la cookie no viajó.
- "HMAC inválido": el SHOPIFY_API_SECRET en Vercel no coincide con el de Shopify.
- "State inválido": JWT_SECRET difiere entre el inicio y el callback (revisa Vercel).
- Redirect mismatch en Shopify: revisa redirect_urls del .toml (ya está bien).
- La fila no aparece pero no hay error: revisa logs de la función en Vercel.

## Etapa 1 = COMPLETA cuando la fila aparece en shopify_store.

Siguiente (Etapa 2): leer el catálogo del vendedor vía Admin GraphQL API.

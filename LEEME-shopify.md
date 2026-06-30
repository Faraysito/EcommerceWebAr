# Shopify OAuth — Etapa 1 (paquete de archivos)

Descomprime este zip en la **raíz de tu repo** (la carpeta que contiene `server/`
y `database/`). Los archivos van a sus rutas correctas. 6 archivos de código + 1 SQL.

## Archivos incluidos

NUEVOS:
- server/src/config/shopify.js
- server/src/services/shopify.service.js
- server/src/controllers/shopify/shopify.controller.js
- server/src/router/shopify.router.js
- database/08-migration-shopify.sql   (ya la corriste; incluida por completitud)

MODIFICADOS (sobrescriben los tuyos — revisa el diff antes si quieres):
- server/src/app.js                   (+2 líneas: import y app.use del shopifyRouter)
- server/src/schemas/env-schema.js    (+5 líneas: las vars SHOPIFY_*)
- server/src/utils/httpStatus.js      (+2 claves: badGateway, serviceUnavailable)

## Pasos

1. Descomprime sobre la raíz del repo. Acepta sobrescribir los 3 modificados.
2. (Ya hecho) `cd server && npm install @shopify/shopify-api`
3. (Ya hecho) Migración SQL en Supabase.
4. (Ya hecho) Env vars en Vercel: SHOPIFY_API_KEY, SHOPIFY_API_SECRET,
   SHOPIFY_SCOPES, SHOPIFY_APP_URL. Falta añadir:
       SHOPIFY_FRONTEND_URL=https://ecommerce-web-ar-client.vercel.app
   (tiene default en el schema, pero mejor explícita en Vercel.)
5. Añade lo mismo a tu .env local (incluye SHOPIFY_FRONTEND_URL).
6. Commit + push a main. Vercel redeploya solo.

## Probar el flujo (tras el deploy)

El vendedor debe iniciar el OAuth ESTANDO LOGUEADO en tu app (cookie JWT), porque
/api/shopify/auth está protegido. Abre, ya logueado:

    https://ecommerce-web-ar-server.vercel.app/api/shopify/auth?shop=hublab-test.myshopify.com

Esperado: redirige a Shopify -> pantalla de permisos -> aceptar -> vuelve a
/vender?shopify=connected&shop=hublab-test.myshopify.com, y aparece una fila en
la tabla shopify_store de Supabase con el access_token.

Si da error, revisa el mensaje (HMAC inválido = secret mal copiado; state
inválido = JWT_SECRET distinto entre auth y callback; redirect mismatch =
revisar redirect_urls en el .toml de Shopify).

## Falta para cerrar Etapa 1 (UI)

Un botón en tu SellerDashboard que lleve a /api/shopify/auth?shop=<dominio>.
Pídelo aparte: es un componente React con input para el dominio myshopify.

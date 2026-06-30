# Shopify Etapa 4 — Theme App Extension (visor AR sin copy-paste)

El vendedor activa el visor AR desde el editor de temas de Shopify, en la página
de producto, sin pegar ningún iframe. El bloque consulta tu backend y, si el
producto tiene modelo asignado (Etapa 3), renderiza <model-viewer> con AR.

## Dos partes

A) BACKEND (endpoint público de resolución) — va al repo, se despliega en Vercel.
B) EXTENSIÓN (theme app extension) — va a Shopify vía `shopify app deploy`.

═══════════════════════════════════════════════════════════════════
PARTE A — Backend
═══════════════════════════════════════════════════════════════════

Archivos (descomprime en la raíz, sobrescribe):
- server/src/services/shopify-embed.service.js               (NUEVO)
- server/src/controllers/shopify/shopify-embed.controller.js (NUEVO)
- server/src/router/shopify.router.js                        (MOD: +ruta pública)

Nuevo endpoint PÚBLICO (sin auth, CORS abierto):
  GET /api/shopify/ar?shop=xxx.myshopify.com&product_id=123
  -> { hasModel, name, modelUrl, widthCm, heightCm, depthCm }

Pasos:
1. Descomprime, sobrescribe los 3.
2. node --check server/src/router/shopify.router.js
3. Commit + push. Vercel redeploya.
4. Verifica:
     curl "https://ecommerce-web-ar-server.vercel.app/api/shopify/ar?shop=hublab-test.myshopify.com&product_id=123"
   Debe devolver {"hasModel":false} para un id sin modelo, o los datos si ese
   producto tiene uno asignado. (Para probar con uno real, mira en Supabase
   shopify_product_model qué GID tiene modelo y usa su número final.)

═══════════════════════════════════════════════════════════════════
PARTE B — Extensión (en tu carpeta del proyecto, junto al .toml de la app)
═══════════════════════════════════════════════════════════════════

La carpeta "extension/" de este zip ES la theme app extension. Hay que colocarla
donde la CLI la detecte: dentro de extensions/<nombre>/ en la raíz del repo.

Pasos:

1. Crea la carpeta de extensiones y mueve los archivos:
     mkdir extensions
     mkdir extensions\ar-viewer-block          (Windows: usa el explorador)
   Copia DENTRO de extensions/ar-viewer-block/ el contenido de "extension/" del
   zip, de modo que quede así:

     extensions/
       ar-viewer-block/
         shopify.extension.toml
         blocks/ar-viewer.liquid
         assets/ar-viewer.js
         locales/en.default.json

   (El shopify.extension.toml debe quedar en la raíz de ar-viewer-block/.)

2. Despliega la extensión a Shopify (la CLI ya está vinculada a tu app):
     shopify app deploy
   Confirma "Yes, release". Esto sube la extensión. Ahora "AR Viewer" tiene una
   nueva versión que incluye el bloque de tema.

3. Instala/actualiza la app en tu tienda si hace falta (ya la instalaste en
   Etapa 1, así que la extensión queda disponible automáticamente).

4. Activa el bloque en el tema:
   - Shopify admin de hublab-test -> Online Store -> Themes -> Customize.
   - Navega a una página de PRODUCTO (selector de plantilla arriba: Products ->
     Default product).
   - "Add block" / "Agregar bloque" en la sección del producto -> busca
     "Visor AR" (bajo Apps).
   - Colócalo donde quieras (debajo del precio, p.ej.). Save.

5. Prueba:
   - Asegúrate de que ESE producto tenga un modelo asignado (Etapa 3, pestaña
     Shopify en /vender -> Asignar AR).
   - Abre la página pública de ese producto en hublab-test.
   - Debe aparecer el visor 3D. En móvil, el botón "Ver en tu espacio" abre AR.
   - Si el producto NO tiene modelo, el bloque se oculta solo (no muestra nada).

## Cómo encaja todo

Etapa 1: el vendedor conecta su Shopify (OAuth, token guardado).
Etapa 2: ves su catálogo real en tu panel.
Etapa 3: asignas un .glb + medidas a cada producto Shopify (guardado en Supabase).
Etapa 4: el bloque de tema, en el storefront, pregunta al backend por el modelo
         de cada producto y lo renderiza con AR. Sin iframe manual.

## Notas y límites honestos

- El visor depende de que tu backend Vercel responda (el bloque hace fetch a
  /api/shopify/ar). Si el backend cae, el bloque se oculta (no rompe la página).
- model-viewer 3.5.0 cargado desde CDN de Google. Si prefieres fijar versión o
  self-host, cámbialo en ar-viewer.liquid.
- La escala usa las medidas en cm que pusiste en Etapa 3 (model-viewer trabaja
  en metros; el JS divide /100). Si no pusiste medidas, usa la escala nativa
  del .glb.
- shop.permanent_domain en Liquid da el dominio myshopify de la tienda, que es
  exactamente la clave con la que guardamos la asignación. Por eso coincide.

## Esto cierra las 4 etapas del plan.

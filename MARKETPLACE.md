# Conversión a MARKETPLACE multivendedor

Este paquete convierte tu tienda de un solo local en un **marketplace** donde
**cualquier cuenta puede comprar y vender** (estilo Temu / AliExpress), con
auto-aprobación: la tienda queda activa al instante, sin revisión de admin.

Todo compila: `vite build` pasa en el cliente y el servidor arranca y responde
en `/api/health`.

---

## ⚠️ Antes que nada: lo que SÍ y lo que NO hace

**Sí hace (completo y funcional):**

- Cualquier cliente abre su tienda con un clic y publica productos (con fotos y
  modelo 3D para AR), define precio y stock.
- El catálogo público mezcla productos de todos los vendedores y muestra
  "Vendido por [tienda]" con enlace a la tienda.
- Una sola compra puede tener productos de **varios vendedores**. El sistema
  divide la orden por vendedor, calcula la **comisión** del marketplace y genera
  un **payout** (lo que se le debe a cada vendedor).
- Panel de vendedor: productos, ventas (con estado de despacho que el vendedor
  cambia), y ganancias (por cobrar / pagado / comisión).
- Panel de admin: ajustar la comisión global, ver todos los vendedores, y
  marcar payouts como pagados.

**NO hace (y es importante que lo sepas):**

- **El dinero NO se reparte solo entre vendedores.** Webpay cobra todo a una
  sola cuenta (la tuya). Pagarle a cada vendedor es una **transferencia manual**
  que el admin marca como "Pagado". El reparto automático de fondos por vendedor
  (split payment real) Transbank no lo ofrece de fábrica y es un tema legal y
  financiero serio. Confirma con quien te asignó la tarea si el payout simulado
  (manual) es aceptable para la entrega.

---

## PASO OBLIGATORIO: correr la migración de base de datos

En el **SQL Editor de Supabase**, corre el archivo nuevo **después** de tus
cuatro migraciones anteriores:

    database/05-migration-marketplace.sql

Esto añade los campos de vendedor a `customer`, `seller_id` a `product`, el
desglose por vendedor en `sale_product`, y las tablas nuevas `payout` y
`marketplace_setting`. No recrea nada existente; usa `IF NOT EXISTS` en todo.

> Detalle de siempre: las tablas van con comillas (`"customer"`, `"product"`).
> El archivo ya las usa.

### Si ya tenías productos del local original

La migración intenta asignarlos al primer vendedor que exista. Si todavía no hay
vendedores cuando la corres, esos productos quedan con `seller_id` en NULL y no
aparecen en el catálogo hasta que les asignes un vendedor. Lo más simple: crea
una cuenta, ábrela como tienda, y en el SQL Editor corre:

```sql
UPDATE "product" SET "seller_id" = (
  SELECT "id" FROM "customer" WHERE "is_seller" = true LIMIT 1
) WHERE "seller_id" IS NULL;
```

---

## Cómo aplicarlo

Reemplaza las carpetas `client/`, `server/` y `database/` de tu repo por estas
(o copia archivo por archivo si prefieres revisar). **No incluye `node_modules`
ni `.env`** — esos los conservas tú.

Luego, como siempre:

    cd server && npm install && npm run dev
    cd client && npm install && npm run dev

> Nota: arreglé un problema con `transbank-sdk` (la versión instalada es CommonJS
> y los imports con nombre de ESM fallaban, impidiendo que el server arrancara).
> Ahora usa import por defecto. Si tu `package-lock` fijaba otra versión, esto te
> destraba el arranque.

---

## Flujo completo para probar

1. **Corre la migración** (arriba).
2. Entra al sitio, crea una cuenta (botón "Ingresar" → "Crear una").
3. Click en **"Vender"** (en el menú superior). Como aún no vendes, verás el
   llamado a abrir tienda. Pon un nombre y ábrela.
4. Ya en el panel de vendedor, ve a **"Mis productos" → "Publicar producto"**,
   sube una foto y completa los datos. Repite con otra cuenta para tener dos
   tiendas.
5. Cierra sesión, entra con una tercera cuenta (un comprador), agrega al carrito
   productos de las dos tiendas y paga con Webpay (ambiente de integración).
6. Como vendedor, en **"Ventas"** verás tu parte de esa orden y podrás cambiar
   el estado de despacho. En **"Ganancias"** verás tu monto por cobrar.
7. Como admin (`/admin/login`), pestaña **"Marketplace"**: ajusta la comisión,
   mira los vendedores y marca los payouts como pagados.

---

## Mapa de archivos nuevos y modificados

### Base de datos

- **nuevo** `database/05-migration-marketplace.sql`

### Backend (`server/src`)

- **servicios reescritos:** `services/customer.service.js` (cuenta unificada
  comprador/vendedor + slugs de tienda), `services/product.service.js`
  (pertenencia por vendedor), `services/sale.service.js` (división por vendedor,
  comisión, payouts)
- **servicio nuevo:** `services/marketplace.service.js` (comisión + payouts)
- **controllers nuevos:** `controllers/customer/seller.controller.js`,
  `controllers/customer/seller-product.controller.js`,
  `controllers/customer/seller-sales.controller.js`,
  `controllers/marketplace/marketplace.controller.js`
- **modificados:** `controllers/customer/customer-auth.controller.js` (JWT con
  `isSeller`), `controllers/sales/sale.controller.js` (genera payouts al pagar),
  `controllers/products/product.controller.js`, `router/customer.router.js`,
  `router/public.router.js`, `router/admin.router.js`,
  `schemas/env-schema.js` y `services/transbank.service.js` (fix de import)

### Frontend (`client/src`)

- **páginas nuevas:** `pages/SellerDashboard.jsx`, `pages/StorePage.jsx`,
  `pages/StoresDirectory.jsx` (+ sus `.module.css`)
- **componentes de vendedor nuevos:** `components/seller/BecomeSellerCta.jsx`,
  `SellerProducts.jsx`, `SellerSales.jsx`, `SellerEarnings.jsx`,
  `SellerStoreForm.jsx` (+ `SellerForms.module.css`)
- **admin nuevo:** `admin/MarketplaceManager.jsx` (+ css)
- **servicios nuevos:** `services/seller/sellerService.js`,
  `services/marketplace/marketplaceService.js`
- **modificados:** `context/CustomerAuthContext.jsx` (estado de vendedor),
  `components/Header.jsx` (enlaces "Vender" y "Tiendas", "Mi tienda" en el
  menú), `components/ProductCard.jsx` ("Vendido por"), `admin/AdminDashboard.jsx`
  (pestaña Marketplace), `routes.jsx` (rutas nuevas)

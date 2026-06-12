# EcommerceWebAR — Fases 1 a 4

Este paquete contiene las carpetas `client/`, `server/` y `database/` con los
cambios de las Fases 1–4 ya integrados sobre tu proyecto. Todo compila
(verificado con `vite build` en el client y chequeo de imports en el server).

## Cómo aplicarlo

Reemplaza las carpetas `client/` y `server/` de tu repo por estas (o copia
archivo por archivo si prefieres revisar). **No incluye `node_modules` ni
`.env`** — esos los conservas tú.

### PASO OBLIGATORIO antes de probar: correr la migración de BD

En el **SQL Editor de Supabase**, corre el archivo:

    database/migration-sales.sql

Esto añade `customer.name` y unos índices. Las tablas `customer`, `sale` y
`sale_product` ya existían en tu schema, no se recrean.

> Recuerda el detalle de siempre: la tabla `"user"` (y aquí también `customer`)
> va con comillas. El archivo de migración ya las usa.

Después: `cd server && npm run dev` y `cd client && npm run dev` como siempre.

---

## Qué incluye cada fase

### Fase 1 — Búsqueda / filtros (frontend)

- El buscador del Header ahora **filtra de verdad** por nombre, sobre todo el
  catálogo. Mientras buscas, se ocultan las pestañas de categoría y se muestra
  "Resultados para …".
- Archivos: `client/src/components/Header.jsx`, `client/src/pages/Catalog.jsx`.

### Fase 2 — Gestión de usuarios en el admin

- Nueva pestaña **Usuarios** en el panel: listar, crear (con selector de rol) y
  eliminar. No puedes eliminar tu propia cuenta.
- Backend: se añadió `GET /api/admin/roles` (para el selector). El resto de
  endpoints de usuarios ya existían.
- Archivos nuevos: `client/src/admin/UsersManager.jsx` (+ css),
  `client/src/services/users/userAdminService.js`. Modificados:
  `AdminDashboard.jsx`, `user.service.js`, `user.controller.js`,
  `admin.router.js`.

### Fase 3 — Carrito + ventas + cuenta de cliente

- **Cliente de la tienda** (quien compra) con su propia sesión: registro/login
  con email + contraseña, cookie httpOnly `customer-token` (igual de seguro que
  el admin, separado de él).
- **Carrito** (estado en memoria) con botón "Agregar" en cada card, contador en
  el Header, modal de carrito con cantidades y total.
- **Checkout**: valida stock, recalcula precios con ofertas **en el servidor**
  (no se confía en el cliente), crea la venta + sus líneas y descuenta stock.
- Backend nuevo: `customer.service.js`, `sale.service.js`, controllers de
  customer-auth y sales, `customer.router.js`, middleware y cookie de cliente.
  Montado en `/api/customer/*`.
- Frontend nuevo: `CartContext`, `CustomerAuthContext`, `CartModal`,
  `CustomerAuthModal`, servicios de customer. Modificados: `ProductCard.jsx`,
  `Header.jsx`, `main.jsx`.

### Fase 4 — Historial de pedidos del cliente

- Página **/pedidos**: lista los pedidos del cliente logueado con estado
  (Pendiente / En progreso / Completado), líneas y total. Accesible desde el
  menú de cuenta en el Header.
- Backend: `GET /api/customer/orders`.
- Archivos: `client/src/pages/Orders.jsx` (+ css), ruta en `routes.jsx`.

---

## Notas / decisiones

- **Auth de cliente = email + contraseña + cookie httpOnly**, coherente con tu
  admin (NO localStorage, NO Gmail). Esto fue lo que elegiste.
- **El total real lo calcula el backend** en cada checkout. El carrito del
  front solo muestra; nadie puede manipular precios desde el navegador.
- **Stock**: se valida dos veces (al armar la venta y justo antes de descontar)
  para reducir condiciones de carrera. Si necesitas atomicidad estricta, el
  paso siguiente sería mover `createSale` a una función RPC de Postgres.
- **Pendiente (Fase 6)**: pasarela de pago real (Webpay/Transbank o Mercado
  Pago). Hoy el pedido queda en estado "Pendiente" sin cobro. Eso requiere tus
  credenciales de comercio.

## Probar el flujo completo

1. Corre la migración SQL.
2. Levanta server y client.
3. En la tienda: agrega productos al carrito → abre el carrito → "Iniciar
   sesión y comprar" → crea una cuenta de cliente → se confirma el pedido y baja
   el stock.
4. Menú de cuenta (arriba a la derecha) → "Mis pedidos" → ves el pedido.
5. En `/admin` → pestaña Usuarios → gestiona usuarios del panel.

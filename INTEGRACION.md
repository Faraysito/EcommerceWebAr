# Guía de integración — paquete de nuevas funcionalidades

Este paquete agrega: **reseñas y calificaciones**, **favoritos (wishlist)**,
**direcciones de despacho**, **ficha de producto dedicada**, **recomendador de
productos similares**, **filtros/orden/paginación de catálogo**, **AR a escala
real con medidas**, **compartir con QR**, **rate limiting** y **code-splitting**.

Copia las carpetas `client/` y `server/` sobre las de tu proyecto (respetan la
misma estructura). Abajo se detalla qué es **drop-in** (reemplaza tal cual) y
qué necesita **un pequeño edit manual** o un **paso extra**.

---

## 1. Base de datos (paso extra obligatorio)

Corre en el **SQL Editor de Supabase**, después de tus 5 migraciones previas:

```
database/06-migration-reviews-wishlist-addresses.sql
```

Crea las tablas `review`, `wishlist`, `customer_address`, agrega columnas de
dimensiones a `product` (`width_cm`, `height_cm`, `depth_cm`, `weight_g`) y los
permisos `review.read` / `review.delete`.

Sin este paso, los endpoints nuevos responderán error de tabla inexistente.

---

## 2. Archivos DROP-IN (reemplazan al original tal cual)

Estos archivos ya existían y se reemplazan por completo (hacé respaldo si querés):

- `client/src/main.jsx` — agrega `WishlistProvider` y usa el carrito persistente.
- `client/src/routes.jsx` — code-splitting + rutas nuevas `/producto/:id`,
  `/favoritos`, `/cuenta`.
- `server/src/index.js` — monta los routers nuevos y aplica rate limiting.
- `server/src/utils/httpStatus.js` — agrega el código `429` (tooManyRequests).

> Nota carrito: `main.jsx` importa `CartProvider` desde
> `context/CartContextPersistent.jsx` (guarda el carrito en localStorage). Si
> preferís el carrito en memoria como antes, cambiá ese import de vuelta a
> `./context/CartContext`. **No se tocó tu `CartContext.jsx` original.**

---

## 3. Archivos NUEVOS (no pisan nada; solo se agregan)

**Backend**

- `server/src/services/`: `review.service.js`, `wishlist.service.js`,
  `address.service.js`, `recommendation.service.js`
- `server/src/controllers/`: `reviews/review.controller.js`,
  `wishlist/wishlist.controller.js`, `addresses/address.controller.js`,
  `products/similar.controller.js`
- `server/src/router/`: `public-extras.router.js`, `customer-extras.router.js`,
  `admin-extras.router.js`
- `server/src/middlewares/rate-limit.middleware.js`

**Frontend**

- `client/src/services/`: `reviews/reviewService.js`,
  `wishlist/wishlistService.js`, `addresses/addressService.js`,
  `products/getProduct.js`
- `client/src/context/`: `WishlistContext.jsx`, `CartContextPersistent.jsx`
- `client/src/hooks/useProductFilters.js`
- `client/src/components/`: `StarRating`, `ProductReviews`, `FavoriteButton`,
  `ShareButton`, `ArModalScaled`, `CatalogFilters`, `Pagination`,
  `AddressManager` (cada uno con su `.module.css`)
- `client/src/pages/`: `ProductPage`, `WishlistPage`, `AccountPage`
  (cada una con su `.module.css`)

Todo esto compila y arranca sin tocar nada más (verificado con `vite build` y
chequeo de sintaxis del server).

---

## 4. Ediciones manuales OPCIONALES (para enganchar la UI nueva)

Lo siguiente **funciona sin tocarlo**, pero para que el usuario vea las
funciones en pantalla conviene cablear unos pocos puntos. Son cambios chicos:

### 4.1 Mostrar corazón + link a la ficha en cada card

En `client/src/components/ProductCard.jsx`:

```jsx
import FavoriteButton from './FavoriteButton'
// ...dentro de .thumbWrap, junto a los badges:
;<FavoriteButton
  productId={product.id}
  className={styles.favOnCard}
/>
// ...y para abrir la ficha, envolvé la imagen o el nombre con:
import { Link } from 'react-router'
;<Link to={`/producto/${product.id}`}>{/* imagen o nombre */}</Link>
```

### 4.2 Filtros + paginación en el catálogo

En `client/src/pages/Catalog.jsx`, reemplazá el filtrado manual por el hook:

```jsx
import { useProductFilters } from '../hooks/useProductFilters'
import CatalogFilters from '../components/CatalogFilters'
import Pagination from '../components/Pagination'

const f = useProductFilters(products, { pageSize: 12 })
// render: <CatalogFilters filters={f} categories={categories} />
//         <ProductSection title="Catálogo" products={f.pageItems} />
//         <Pagination page={f.page} totalPages={f.totalPages} onChange={f.setPage} />
```

(El hook ya hace categoría/precio/orden/AR/oferta/stock + paginación en cliente.)

### 4.3 Enlaces de menú a Favoritos y Mi cuenta

En `client/src/components/Header.jsx`, dentro del menú de cuenta:

```jsx
<button className={styles.menuItem} onClick={() => navigate('/favoritos')}>Favoritos</button>
<button className={styles.menuItem} onClick={() => navigate('/cuenta')}>Mi cuenta</button>
```

### 4.4 (Vendedor) capturar dimensiones del producto

Para que el AR a escala real tenga medidas, agregá inputs de alto/ancho/prof.
en el form de `client/src/components/seller/SellerProducts.jsx` y mandá
`heightCm/widthCm/depthCm/weightG` en el payload. Esto requiere además aceptar
esos campos en el backend (`product.service.js` + el schema del controller),
que **no se modificó** para no pisar tu lógica. Lo podemos hacer en un segundo
paso.

---

## 5. Endpoints nuevos (referencia)

Públicos:

- `GET /api/products/:productId/reviews` → `{ summary:{average,count}, reviews:[] }`
- `GET /api/products/:id/similar?limit=8` → `[ productos ]`

Cliente (cookie `customer-token`):

- `PUT /api/customer/products/:productId/reviews` `{ rating, comment }`
- `DELETE /api/customer/reviews/:id`
- `GET /api/customer/wishlist` · `GET /api/customer/wishlist/ids`
- `POST /api/customer/wishlist` `{ productId }` · `DELETE /api/customer/wishlist/:productId`
- `GET/POST /api/customer/addresses` · `PUT/DELETE /api/customer/addresses/:id`

Admin (cookie `auth-token`, permiso `review.delete`):

- `DELETE /api/admin/reviews/:id`

---

## 6. Notas

- **Rate limiter**: es en memoria (sin dependencias). Para varias instancias
  conviene moverlo a Redis más adelante.
- **QR de compartir**: usa `api.qrserver.com` (servicio externo, sin instalar
  nada). Si no querés depender de un tercero, se cambia por una lib local.
- No se agregaron dependencias nuevas a `package.json`.

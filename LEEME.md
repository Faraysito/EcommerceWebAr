# HublabExpress — Reforma visual completa

Rediseño de toda la app cliente: marca **HublabExpress**, tema **oscuro/tech**
(paleta de HubLab: azul profundo, gradiente cian→azul y verde menta) y layout
estilo **AliExpress** (header con buscador protagónico + mega-menú de
categorías, hero, cards densas con rating y "vendidos", badges de descuento y AR).

Incluye además todas las funcionalidades del paquete anterior (reseñas,
favoritos, direcciones, ficha de producto, similares, filtros, AR a escala),
ya integradas y con el tema aplicado.

---

## Cómo aplicar

Esta carpeta contiene **solo la parte `client/`**. Copiá su contenido sobre tu
proyecto, reemplazando cuando pregunte:

```
copiar  reforma/client/*  ->  TU_PROYECTO/client/
```

Es decir: `client/index.html` y todo `client/src/` se reemplazan. No toca el
`server/` ni la base de datos.

Después:

```
npm run dev:both
```

Verificado: el cliente compila (`vite build`) y el dev server arranca sin
errores.

---

## Qué cambió

### Identidad

- Marca **FiguraAR → HublabExpress** (header, footer, login admin, título de la
  pestaña, `config/store.js`).
- Tema central nuevo en `client/src/assets/theme.css`: todos los colores,
  tipografía (Inter), radios y sombras como variables CSS. **Cambiás un color
  ahí y se actualiza toda la app.**
- `global.css` con fondo oscuro, glow sutil de fondo y scrollbar al tono.

### Layout tipo AliExpress

- **Header** (`components/Header.jsx`): dos filas — logo + buscador grande +
  cuenta/carrito arriba; barra de categorías con **mega-menú desplegable**
  abajo. El buscador y las categorías navegan con `?q=` y `?cat=`.
- **Home / Catálogo** (`pages/Catalog.jsx`): hero con gradiente, tabs de
  categoría, panel de filtros (precio, AR, oferta, stock, orden) y grilla
  paginada.
- **ProductCard**: card densa con imagen cuadrada, badge de descuento, badge
  **AR**, corazón de favorito, **rating con estrellas** y **"X vendidos"**,
  precio destacado y botón de carrito + acceso directo a AR. La imagen y el
  nombre llevan a la ficha `/producto/:id`.

### Todo en tema oscuro

- Todas las páginas (pedidos, tiendas, ficha, favoritos, cuenta, panel
  vendedor) y el **panel admin** completo recoloreados al tema HubLab.
- Modales (carrito, login, descripción, AR) en oscuro.

### Funcionalidades (del paquete anterior, ya integradas)

- Ficha de producto, reseñas y rating, favoritos, direcciones, productos
  similares, filtros/orden/paginación, AR a escala real, compartir con QR.
- **Carrito persistente**: `context/CartContext.jsx` ahora guarda en
  localStorage (es el único contexto de carrito; no hay archivo duplicado, así
  que no se repite el error de "useCart fuera de CartProvider").

---

## Pasos extra que siguen pendientes (no son de esta reforma)

1. **Base de datos**: tenés que tener corridas todas las migraciones en
   Supabase, incluida la del paquete anterior
   `database/06-migration-reviews-wishlist-addresses.sql`. Sin las tablas
   `review`, `wishlist`, `customer_address` y las columnas que faltaban
   (`name`, etc.), esas secciones dan error — pero es de la base, no del diseño.

2. **Datos opcionales en las cards**: el rating y "vendidos" en la card se
   muestran solo si el backend manda `ratingAverage`/`ratingCount`/`soldCount`
   en cada producto. Hoy el backend no los incluye, así que esos dos datos no
   aparecen todavía (la card funciona igual sin ellos). Conectarlos es un
   cambio chico en `product.service.js` que podemos hacer después.

3. **Campos de dimensiones del vendedor** (para AR a escala real): siguen
   pendientes como en el paquete anterior.

---

## Si algo no se ve bien

- Pantalla en blanco → abrí la consola (F12 → Console) y pasame el error rojo.
  El cambio más sensible es `main.jsx`/`routes.jsx`; si algo no calza, ahí está.
- Un color que se ve raro → se ajusta en un solo lugar, `assets/theme.css`.

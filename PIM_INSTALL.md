# Weseller PIM + DAM — Instalación

Módulo aditivo sobre el repo existente (EcommerceWebAr). No borra ni modifica el storefront.
Extrae el `.zip` en la **raíz del repo**: los archivos caen en su lugar. Luego aplica 2 ediciones manuales y corre migración + seeds.

## 1. Archivos que se agregan (ya incluidos en el zip)

```
database/10-migration-pim.sql          migración PIM/DAM (aditiva)
database/11-seed-pim-demo.sql          datos ficticios de demo
server/src/utils/csv.js
server/src/schemas/pim.schema.js
server/src/middlewares/pim-upload.middleware.js
server/src/services/pim.service.js
server/src/services/pim-asset.service.js
server/src/services/pim-import.service.js
server/src/controllers/pim/*.js        (6 controladores)
server/src/router/pim.router.js
server/src/scripts/seed-pim-users.js
client/src/services/pim/pimService.js
client/src/pim/*.jsx  +  Pim.module.css (8 vistas)
demo-import-example.csv                CSV de ejemplo para el importador
```

## 2. Edición 1 — montar el router en el backend

`server/src/app.js`

Junto a los otros imports de router (arriba, ~línea 15):
```js
import { pimRouter } from './router/pim.router.js'
```

Junto a los otros `app.use('/api'...)` (~línea 52), agrega:
```js
app.use('/api/pim', pimRouter) // PIM + DAM (Weseller)
```

## 3. Edición 2 — agregar la ruta en el frontend

`client/src/routes.jsx`

Con los otros `lazy(...)` (~línea 20):
```js
const PimApp = lazy(() => import('./pim/PimApp'))
```

Dentro del array de `createBrowserRouter([...])`, agrega una ruta protegida:
```js
{
  path: '/pim',
  element: <ProtectedRoute>{s(<PimApp />)}</ProtectedRoute>
},
```

## 4. Base de datos (Supabase → SQL Editor)

Corre en orden:
1. `database/10-migration-pim.sql`
2. `database/11-seed-pim-demo.sql`  (opcional; carga la demo)

Requiere que ya existan las migraciones `01`…`09` y el rol `admin` (`02-test-values.sql`).

## 5. Usuarios de acceso

Desde `server/`:
```bash
node src/scripts/seed-pim-users.js
```

Crea, con rol superadmin:
- `paula.fritz@virtualizar.cl`
- `Pablo.troncoso@virtualizar.cl`

Contraseña por defecto: `Weseller2025` (o define `PIM_DEMO_PASSWORD` en el `.env`). Cámbiala tras el primer login.

## 6. Uso

Ingresa por `/admin/login` con cualquiera de los usuarios → navega a `/pim`.

Pestañas: **Panel** (KPIs), **Productos** (fichas + completitud + publicar), **Familias y atributos** (esquema flexible), **Importar CSV** (carga masiva con mapeo — prueba con `demo-import-example.csv` sobre la familia *Vestuario*), **Activos (DAM)** (imágenes/3D/PDF/video con tags), **Canales** (sindicación).

## Notas

- **Acceso online:** el módulo corre sobre el mismo deploy (Vercel + Supabase) del repo. Al desplegar con estos archivos y las variables de entorno ya configuradas, `https://<tu-dominio>/pim` queda disponible para ambos usuarios.
- **Permisos:** las rutas `/api/pim/*` exigen el permiso `pim.access` (creado por la migración y asignado al rol admin). El superadmin lo bypasea.
- **Storefront:** los productos creados en el PIM con `seller_id` nulo también aparecen en el catálogo público del marketplace. Es esperado para la demo; si no lo quieres, filtra por `pim_status = 'published'` en el catálogo o asígnales un vendedor.
- **Sindicación Shopify:** `syndicate()` marca el producto como publicado y arma el payload canal-agnóstico. El push real vía Admin API se conecta en el punto marcado dentro de `pim.service.js` (`syndicate`), reutilizando el conector Shopify existente.
- **Excel:** el importador usa CSV (estándar universal). Para `.xlsx` nativo se puede sumar SheetJS más adelante sin cambiar el flujo.

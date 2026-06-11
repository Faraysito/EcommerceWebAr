# EcommerceWebAr

Plataforma de e-commerce con visualización de productos en Realidad Aumentada (AR).  
Proyecto en desarrollo activo, migrado desde un menú web AR de restaurante hacia un sistema de comercio electrónico completo.

## Stack Tecnológico

| Capa          | Tecnología              |
| ------------- | ----------------------- |
| Monorepo      | npm workspaces          |
| Backend       | Express 5 + Supabase    |
| Frontend      | React 19 + Vite 8       |
| Enrutamiento  | React Router 7          |
| Base de datos | PostgreSQL (Supabase)   |
| Archivos      | Supabase Storage        |
| Autenticación | JWT + bcrypt            |
| Validación    | Zod 4                   |
| Linter        | ESLint 10 (flat config) |
| Formateo      | Prettier 3              |
| CI/CD         | GitHub Actions          |

## Comandos para instalar dependencias con npm workspaces

en el caso de que quieras instalar alguna dependencia para el `client` (frontend) o `server` (backend) respectivamente, debes agregar el siguiente parámetro al comando `--workspace=`

```sh
npm install express --workspace=server # Instalar dependencia en el backend
npm install zustand --workspace=client # Instalar dependencias en el frontend
```

> [!note]
> Si no agregas el parámetro `--workspace=`, lo que hará es instalar la dependencia en el monorepo (raíz).

## Estructura del Proyecto

```
EcommerceWebAr/
├── client/          # Frontend React + Vite
├── server/          # API REST con Express + Supabase
├── database/        # Esquema SQL y datos de prueba
├── .github/         # Workflows de CI
└── package.json     # Raíz del monorepo
```

## Requisitos Previos

- Node.js >= 22
- Cuenta en [Supabase](https://supabase.com) (o instancia propia de PostgreSQL con Storage)
- npm >= 10

## Configuración de Variables de Entorno

Copia los archivos de ejemplo y completa los valores:

```bash
cp server/.env-example server/.env
cp client/.env-example client/.env
```

### Server (`server/.env`)

| Variable          | Obligatorio | Descripción                                      |
| ----------------- | ----------- | ------------------------------------------------ |
| `NODE_ENV`        | No          | Modo de ejecución (`development` / `production`) |
| `PORT`            | No          | Puerto del servidor (por defecto: `3000`)        |
| `ALLOWED_ORIGINS` | No          | Orígenes permitidos para CORS                    |
| `SUPABASE_URL`    | Sí          | URL del proyecto Supabase                        |
| `SUPABASE_KEY`    | Sí          | Clave anónima o de servicio de Supabase          |
| `SUPABASE_BUCKET` | Sí          | Bucket de Storage para imágenes y modelos 3D     |
| `JWT_SECRET`      | Sí          | Secreto para firmar tokens JWT (mín. 32 chars)   |

### Client (`client/.env`)

| Variable       | Obligatorio | Descripción                                               |
| -------------- | ----------- | --------------------------------------------------------- |
| `VITE_API_URL` | No          | URL base de la API (por defecto: `http://localhost:3000`) |

## Base de Datos

El esquema se encuentra en `database/schema.sql` e incluye las tablas:

- `user`, `role`, `permission`, `role_permission` — gestión de usuarios y permisos
- `category`, `product` — catálogo de productos
- `image`, `model`, `product_image` — imágenes y modelos 3D
- `sale`, `sale_product` — ventas
- `offer` — descuentos
- `customer` — clientes

Ejecuta el schema contra tu base de datos Supabase y opcionalmente inserta los datos de prueba con `database/test-values.sql`.

## Instalación

```bash
npm install
```

## Ejecución en Desarrollo

Levanta ambos servicios simultáneamente:

```bash
npm run dev:both
```

O de forma individual:

```bash
npm run dev:server   # Servidor en http://localhost:3000
npm run dev:client   # Cliente en http://localhost:5173
```

## Scripts Disponibles

| Script         | Descripción                               |
| -------------- | ----------------------------------------- |
| `dev:both`     | Ejecuta servidor y cliente en paralelo    |
| `dev:server`   | Inicia el servidor con recarga automática |
| `dev:client`   | Inicia Vite dev server                    |
| `start:server` | Inicia el servidor en producción          |
| `start:client` | Sirve el build de producción del cliente  |
| `lint`         | Ejecuta ESLint en todo el proyecto        |
| `lint:fix`     | Corrige automáticamente problemas de lint |
| `format:check` | Verifica el formateo con Prettier         |
| `format:fix`   | Formatea todos los archivos con Prettier  |

## Documentación por Módulo






# EcommerceWebAR

Tienda e-commerce de figuras coleccionables con visualización en **Realidad Aumentada**. Los clientes navegan el catálogo, ven los detalles de cada figura y la proyectan en su espacio mediante AR antes de comprar. Incluye un panel de administración con autenticación y permisos para gestionar el catálogo.

## Características

- **Catálogo público** — Navegación de productos por categorías, estilo e-commerce.
- **Visualización AR** — Modelos 3D `.glb` proyectables en el espacio real vía WebXR / Scene Viewer / Quick Look (Google `<model-viewer>`).
- **AR directo por QR** — Ruta `/ar/:productId` para abrir una figura directo en AR escaneando un código.
- **Panel admin** — Login con sesión por cookie httpOnly, gestión de categorías (y próximamente productos y archivos).
- **Permisos granulares** — Sistema de roles y permisos en base de datos; el rol `admin` actúa como superadmin con acceso total.
- **Descuentos / ofertas** — Cálculo de precios con descuento en el backend según ofertas vigentes.

## Stack

| Capa        | Tecnología                                          |
| ----------- | --------------------------------------------------- |
| Frontend    | React 19, React Router 7, Vite, CSS Modules         |
| Backend     | Express 5, Node.js                                  |
| AR          | Google `<model-viewer>` (WebXR, Scene Viewer, Quick Look) |
| Auth        | JWT en cookie httpOnly + bcrypt                     |
| Base de datos | Supabase (PostgreSQL)                             |
| Storage     | Supabase Storage (imágenes y modelos 3D)            |
| Validación  | Zod                                                 |

## Estructura del proyecto

```
EcommerceWebAr/
├── client/                  # Frontend (React + Vite)
│   └── src/
│       ├── components/      # Header, Footer, ProductCard, ArModal, etc.
│       ├── pages/           # Catalog, DirectARViewer
│       ├── admin/           # AdminLogin, AdminDashboard, CategoriesManager
│       ├── context/         # AuthContext (estado de sesión)
│       ├── services/        # Cliente API y servicios por recurso
│       ├── hooks/           # useProducts, useCategories, useStoreOpenStatus
│       └── config/          # store.js (datos del negocio), env.js
│
├── server/                  # Backend (Express)
│   └── src/
│       ├── controllers/     # auth, products, categories, files, users
│       ├── services/        # Lógica de acceso a Supabase
│       ├── router/          # auth, public, admin
│       ├── middlewares/     # auth, permission, upload, cors, error
│       ├── schemas/         # Validación de entorno (Zod)
│       ├── scripts/         # seed-admin.js (crea el superadmin)
│       └── config/          # env.js, supabase.js
│
└── database/
    ├── schema.sql           # Tablas, tipos enum y relaciones
    └── test-values.sql      # Roles y permisos por defecto
```

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Una cuenta de Supabase con un proyecto creado

## Variables de entorno

### Servidor (`server/.env`)

```
NODE_ENV="development"
PORT=3000
ALLOWED_ORIGINS=["http://localhost:5173"]
SUPABASE_URL="https://TU_PROYECTO.supabase.co"
SUPABASE_KEY="TU_SECRET_KEY"
SUPABASE_BUCKET="products"
JWT_SECRET="cadena_de_al_menos_32_caracteres"
```

> `SUPABASE_KEY` debe ser la **secret key** (service role), no la publishable.
> Con autenticación por cookie, `ALLOWED_ORIGINS` no puede ser `*`: debe listar el origen del frontend.

### Cliente (`client/.env`)

```
VITE_API_URL=http://localhost:3000
```

## Puesta en marcha

### 1. Instalar dependencias

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Crear la base de datos

En el **SQL Editor** de Supabase, ejecutar en orden:

1. `database/schema.sql` — crea todas las tablas y relaciones.
2. `database/test-values.sql` — crea el rol `admin` y todos los permisos.

### 3. Crear el bucket de Storage

En **Storage** de Supabase, crear un bucket **público** llamado `products` (mismo nombre que `SUPABASE_BUCKET`).

### 4. Crear el superadmin

```bash
cd server
npm run seed:admin
```

Crea por defecto el usuario `admin@figura-ar.cl` con contraseña `admin12345`.
Para usar credenciales propias:

```bash
ADMIN_EMAIL=tucorreo@dominio.cl ADMIN_PASSWORD=tuClaveSegura npm run seed:admin
```

### 5. Levantar el proyecto

En dos terminales separadas:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

- Catálogo: `http://localhost:5173`
- Panel admin: `http://localhost:5173/admin/login`

## Endpoints de la API

### Públicos
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `GET /api/auth/verify`

### Admin (requieren sesión y permiso)
- Productos: `POST` · `PUT /:id` · `DELETE /:id` en `/api/admin/products`
- Categorías: `POST` · `PUT /:id` · `DELETE /:id` en `/api/admin/categories`
- Imágenes: `GET` · `POST` (multipart) · `DELETE /:id` en `/api/admin/images`
- Modelos 3D: `GET` · `POST` (multipart) · `DELETE /:id` en `/api/admin/models`
- Usuarios: `GET` · `POST` · `DELETE /:id` en `/api/admin/users`

## Cómo funciona la autenticación

El login emite un JWT que viaja en una **cookie httpOnly** (`auth-token`). El frontend nunca manipula el token: el navegador lo envía automáticamente en cada petición (con `credentials: 'include'`). El usuario con rol `admin` recibe la bandera `isSuperAdmin` y omite todos los chequeos de permisos; el resto de usuarios solo puede ejecutar las acciones permitidas por su rol.

## Estado del desarrollo

- [x] Catálogo público con visor AR
- [x] Backend completo (productos, categorías, imágenes, modelos, usuarios)
- [x] Base de datos y superadmin
- [x] Login del panel admin
- [x] Gestión de categorías
- [ ] Gestión de productos + uploader de imágenes y modelos 3D
- [ ] Conexión del catálogo a datos reales

## Notas de seguridad

- Nunca subas el archivo `.env` real al repositorio. El archivo `.env-example` debe contener solo valores de ejemplo, jamás claves reales.
- Si una clave queda expuesta, rótala desde Supabase (Settings → API Keys).

- [Documentación del Servidor](server/README.md)
- [Documentación del Cliente](client/README.md)

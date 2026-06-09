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

- [Documentación del Servidor](server/README.md)
- [Documentación del Cliente](client/README.md)

# @ecommercewebar/server

Backend de la plataforma EcommerceWebAr. API REST construida con **Express 5** y **Supabase** (PostgreSQL + Storage).

## Stack

- **Runtime:** Node.js >= 22
- **Framework:** Express 5
- **Base de datos:** Supabase (PostgreSQL) + Supabase Storage
- **Autenticación:** JWT (`jsonwebtoken`) + bcrypt
- **Validación:** Zod 4
- **Cookies:** `cookie-parser` (JWT en httpOnly cookie)

## Estructura

```
server/
├── src/
│   ├── index.js                  # Punto de entrada — configuración de Express
│   ├── config/
│   │   ├── env.js                # Carga y validación de variables de entorno
│   │   └── supabase.js           # Inicialización del cliente de Supabase
│   ├── controllers/
│   │   ├── health-check.controller.js
│   │   └── auth/
│   │       ├── login.controller.js
│   │       ├── register.controller.js
│   │       └── logout.controller.js
│   ├── middlewares/
│   │   ├── cors.middleware.js
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   ├── router/
│   │   └── auth.router.js
│   ├── schemas/
│   │   └── env-schema.js
│   ├── services/
│   │   └── user.service.js
│   └── utils/
│       ├── AppError.js
│       ├── cookie-options.js
│       └── httpStatus.js
├── .env-example                  # Plantilla de variables de entorno
└── package.json
```

## Variables de Entorno

| Variable          | Obligatorio | Por Defecto   | Descripción                                    |
| ----------------- | ----------- | ------------- | ---------------------------------------------- |
| `NODE_ENV`        | No          | `development` | Modo de ejecución                              |
| `PORT`            | No          | `3000`        | Puerto del servidor                            |
| `ALLOWED_ORIGINS` | No          | `*`           | Array JSON de orígenes CORS permitidos         |
| `SUPABASE_URL`    | Sí          | —             | URL del proyecto Supabase                      |
| `SUPABASE_KEY`    | Sí          | —             | Clave anónima o de servicio de Supabase        |
| `SUPABASE_BUCKET` | Sí          | —             | Bucket de Storage para imágenes y modelos 3D   |
| `JWT_SECRET`      | Sí          | —             | Secreto para firmar JWT (mínimo 32 caracteres) |

## Endpoints

| Método | Ruta                 | Descripción                          | Autenticación |
| ------ | -------------------- | ------------------------------------ | ------------- |
| GET    | `/api/health`        | Verificar estado del servidor        | No            |
| POST   | `/api/auth/register` | Registrar nuevo usuario              | No            |
| POST   | `/api/auth/login`    | Iniciar sesión (devuelve JWT cookie) | No            |
| POST   | `/api/auth/logout`   | Cerrar sesión (limpia cookie)        | No            |

## Scripts

```bash
npm run dev     # Inicia con recarga automática (node --watch)
npm start       # Inicia en producción
npm run lint    # Ejecuta ESLint
```

## Desarrollo

1. Copia y configura las variables de entorno:
   ```bash
   cp .env-example .env
   ```
2. Asegúrate de tener una base de datos Supabase corriendo y ejecuta el schema en `database/schema.sql`.
3. Inicia el servidor:
   ```bash
   npm run dev
   ```

El servidor se ejecutará en `http://localhost:3000` por defecto.

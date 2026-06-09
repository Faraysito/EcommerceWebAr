# @ecommercewebar/client

Frontend de la plataforma EcommerceWebAr. Aplicación SPA construida con **React 19**, **Vite 8** y **React Router 7**.

## Stack

- **Framework:** React 19
- **Build tool:** Vite 8
- **Enrutamiento:** React Router 7
- **Validación:** Zod 4
- **Optimización:** React Compiler (vía `babel-plugin-react-compiler`)

## Estructura

```
client/
├── public/                  # Archivos estáticos
├── src/
│   ├── main.jsx            # Punto de entrada de React
│   ├── routes.jsx          # Definición de rutas (React Router)
│   ├── assets/
│   │   └── global.css      # Estilos globales
│   ├── config/
│   │   └── env.js          # Carga y validación de variables de entorno
│   ├── pages/
│   │   └── App.jsx         # Componente principal — página de inicio
│   └── schemas/
│       └── envSchema.js    # Esquema Zod para VITE_API_URL
├── index.html               # HTML de entrada
├── vite.config.js           # Configuración de Vite
├── .env-example             # Plantilla de variables de entorno
└── package.json
```

## Variables de Entorno

| Variable       | Por Defecto             | Descripción                    |
| -------------- | ----------------------- | ------------------------------ |
| `VITE_API_URL` | `http://localhost:3000` | URL base de la API del backend |

## Scripts

```bash
npm run dev       # Inicia el servidor de desarrollo (Vite)
npm run build     # Compila para producción
npm run preview   # Previsualiza el build de producción
npm run lint      # Ejecuta ESLint
```

## Rutas

| Ruta | Componente | Descripción                                    |
| ---- | ---------- | ---------------------------------------------- |
| `/`  | `App`      | Página principal — Hello World + ping a health |

## Desarrollo

1. Asegúrate de que el servidor esté corriendo (ver `server/README.md`).
2. Configura la variable de entorno si el backend corre en otro puerto:
   ```bash
   cp .env-example .env
   ```
3. Inicia el cliente:
   ```bash
   npm run dev
   ```

El servidor de desarrollo se ejecutará en `http://localhost:5173`.

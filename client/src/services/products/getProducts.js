import { MOCK_PRODUCTS } from "../../data/mock";
import { env } from "../../config/env";

// ============================================================
// PUNTO UNICO DE CAMBIO mock -> API real.
//
// Hoy: devuelve los productos mock (backend aun no sirve /api/products).
// Manana: descomentar el bloque de fetch y borrar el return del mock.
// El resto del front no se entera del cambio.
// ============================================================

export const getProducts = async () => {
  // --- MOCK (actual) ---
  // pequeño delay para simular red y ver los skeletons de carga
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_PRODUCTS;

  // --- API REAL (descomentar cuando el backend tenga el endpoint) ---
  // const response = await fetch(`${env.VITE_API_URL}/api/products`);
  // if (!response.ok) throw new Error("Error al cargar los productos");
  // return await response.json();
};

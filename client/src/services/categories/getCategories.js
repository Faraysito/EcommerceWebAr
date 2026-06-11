import { MOCK_CATEGORIES } from "../../data/mock";
import { env } from "../../config/env";

// Mismo patron que getProducts: punto unico de cambio mock -> API real.

export const getCategories = async () => {
  // --- MOCK (actual) ---
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_CATEGORIES;

  // --- API REAL (descomentar cuando exista el endpoint) ---
  // const response = await fetch(`${env.VITE_API_URL}/api/categories`);
  // if (!response.ok) throw new Error("Error al cargar las categorías");
  // return await response.json();
};

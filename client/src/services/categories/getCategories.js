import { env } from "../../config/env";

// Trae las categorias reales del backend ({ id, name, created_at }).
export const getCategories = async () => {
  const response = await fetch(`${env.VITE_API_URL}/api/categories`);
  if (!response.ok) throw new Error("Error al cargar las categorías");
  return await response.json();
};

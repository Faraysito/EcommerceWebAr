import { env } from "../../config/env";

// Trae los productos reales del backend. El backend ya devuelve cada producto
// con la forma que el catalogo espera: id, name, price, stock, image, images,
// model (url del .glb), categoryId, categoryName, discountActive,
// discountedPrice, discountPercent.
export const getProducts = async () => {
  const response = await fetch(`${env.VITE_API_URL}/api/products`);
  if (!response.ok) throw new Error("Error al cargar los productos");
  return await response.json();
};

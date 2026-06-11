// Datos de prueba (mock) mientras el backend no sirve productos todavia.
//
// IMPORTANTE: la forma de cada objeto imita EXACTAMENTE lo que devolvera la
// API real (ver server schema: product / category). Cuando el backend este
// listo, solo se cambia el origen en services/products y services/categories
// de mock -> fetch real, y nada mas del front cambia.
//
// Los modelos .glb son demos publicos de Google <model-viewer> para que la
// AR funcione de verdad en pruebas. Reemplazar por tus modelos reales luego.

// Categorias: { id (uuid-like), name }
export const MOCK_CATEGORIES = [
  { id: "cat-anime", name: "Anime" },
  { id: "cat-games", name: "Videojuegos" },
  { id: "cat-movies", name: "Películas" },
  { id: "cat-classic", name: "Clásicos" },
];

// Productos: forma alineada al schema product + product_image + model + offer.
// Campos que el front consume:
//   id, name, description, price, stock, categoryId
//   image (url principal), model (url .glb o null)
//   discountActive, discountedPrice, discountPercent  <- calculados por el back
const RAW = [
  {
    id: "prod-1",
    name: "Astronauta Coleccionable",
    description:
      "Figura de astronauta con casco articulado y base magnética. Edición limitada con detalles pintados a mano.",
    price: 39990,
    stock: 12,
    categoryId: "cat-classic",
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    discountPercent: 0,
  },
  {
    id: "prod-2",
    name: "Casco Sci-Fi Damaged",
    description:
      "Réplica de casco futurista con acabado desgastado estilo batalla. Ideal para vitrina o escritorio.",
    price: 54990,
    stock: 5,
    categoryId: "cat-games",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb",
    discountPercent: 20,
  },
  {
    id: "prod-3",
    name: "Robot Expresivo",
    description:
      "Figura robótica con cabeza articulada y expresiones intercambiables. Materiales premium.",
    price: 29990,
    stock: 0,
    categoryId: "cat-anime",
    image:
      "https://images.unsplash.com/photo-1546776230-bb86256870ce?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    discountPercent: 0,
  },
  {
    id: "prod-4",
    name: "Silla de Diseño Miniatura",
    description:
      "Réplica a escala de silla icónica de diseño. Pieza de colección para amantes del mobiliario.",
    price: 19990,
    stock: 30,
    categoryId: "cat-classic",
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/SheenChair.glb",
    discountPercent: 10,
  },
  {
    id: "prod-5",
    name: "Hamburguesa Réplica XL",
    description:
      "Réplica realista de hamburguesa para decoración. Detalle increíble en cada capa.",
    price: 14990,
    stock: 8,
    categoryId: "cat-movies",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/Hamburger.glb",
    discountPercent: 0,
  },
  {
    id: "prod-6",
    name: "Astronauta Edición Dorada",
    description:
      "Variante dorada del astronauta coleccionable. Tirada numerada de 100 unidades.",
    price: 49990,
    stock: 3,
    categoryId: "cat-games",
    image:
      "https://images.unsplash.com/photo-1457364887197-9150188c107b?w=400&q=80",
    model:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    discountPercent: 30,
  },
];

// Simula el calculo de descuento que hara el backend, para que el front lea
// los mismos campos (discountActive / discountedPrice) que leera en prod.
function withDiscount(p) {
  const active = p.discountPercent > 0;
  const discountedPrice = active
    ? Math.round(p.price * (1 - p.discountPercent / 100))
    : p.price;
  return {
    ...p,
    discountActive: active,
    discountedPrice,
  };
}

export const MOCK_PRODUCTS = RAW.map(withDiscount);

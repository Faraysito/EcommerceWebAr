import { useEffect, useState } from "react";
import { getProducts } from "../services/products/getProducts";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((items) => setProducts(items))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { products, setProducts, loading, setLoading };
};

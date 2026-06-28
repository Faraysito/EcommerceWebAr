import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { env } from '../config/env.js'

// Recomendador de "productos similares" en JS. Equivale al script de Python
// (ia/sistema-de-recomendacion.py) pero corre dentro del backend, sin Pandas
// ni conexión directa a Postgres. Mismo criterio de similitud:
//   - precio    (peso 0.4)
//   - nombre    (peso 0.4, similitud por bigramas tipo SequenceMatcher)
//   - categoría (peso 0.2, 1 si coincide, 0 si no)
// Devuelve los k productos más parecidos al producto dado (excluyéndolo).

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Similitud de precio: 1 cuando son iguales, cae con la diferencia (misma
// fórmula que el script: 1 / (1 + (dif/100)^2)).
function priceSimilarity(p1, p2) {
  const diff = Math.abs(p1 - p2)
  return 1 / (1 + (diff / 100) ** 2)
}

// Similitud de texto por coeficiente de Sørensen–Dice sobre bigramas.
// Aproxima el ratio de difflib.SequenceMatcher (0..1).
function stringSimilarity(a = '', b = '') {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0

  const bigrams = str => {
    const map = new Map()
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2)
      map.set(bg, (map.get(bg) ?? 0) + 1)
    }
    return map
  }

  const m1 = bigrams(s1)
  const m2 = bigrams(s2)
  let intersection = 0
  for (const [bg, count] of m1) {
    const other = m2.get(bg) ?? 0
    intersection += Math.min(count, other)
  }
  return (2 * intersection) / (s1.length - 1 + (s2.length - 1))
}

// Devuelve los k productos más similares al producto `productId`.
const getSimilarProducts = async ({ productId, k = 8 }) => {
  // Producto base.
  const { data: base, error: baseErr } = await supabase
    .from('product')
    .select('id, name, price, category_id')
    .eq('id', productId)
    .maybeSingle()

  if (baseErr) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo leer el producto')
  }
  if (!base) {
    throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')
  }

  // Universo de candidatos (con datos para mostrar la card).
  const { data: all, error: allErr } = await supabase.from('product').select(`
      id, name, price, stock, category_id, seller_id,
      product_image ( image ( file_key ) ),
      seller:seller_id ( store_name, store_slug )
    `)

  if (allErr) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer los productos')
  }

  const scored = (all ?? [])
    .filter(p => p.id !== base.id)
    .map(p => {
      const score =
        priceSimilarity(p.price, base.price) * 0.4 +
        stringSimilarity(base.name, p.name) * 0.4 +
        (p.category_id === base.category_id ? 1 : 0) * 0.2

      const firstKey = p.product_image?.[0]?.image?.file_key ?? null
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: publicUrl(firstKey),
        sellerId: p.seller_id ?? null,
        storeName: p.seller?.store_name ?? null,
        storeSlug: p.seller?.store_slug ?? null,
        similarityScore: Math.round(score * 1000) / 1000
      }
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)

  return scored.slice(0, k)
}

export { getSimilarProducts }

import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { env } from '../config/env.js'

// ============================================================
// PIM core: familias + atributos (esquema flexible), productos con atributos
// y variantes, cálculo de completitud, y canales de sindicación.
//
// El storefront sigue usando product.service.js; este servicio trabaja sobre
// las mismas tablas pero con la mirada de "ficha maestra" (agnóstica al canal).
// ============================================================

function assetUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Un valor cuenta como "lleno" si existe y no está vacío.
function isFilled(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true // números (incluye 0) y booleanos (incluye false) cuentan
}

// % de completitud según atributos OBLIGATORIOS de la familia.
function computeCompleteness(attributeDefs, values) {
  const required = (attributeDefs ?? []).filter(a => a.required)
  const missing = []
  let filled = 0
  for (const def of required) {
    if (isFilled(values?.[def.code])) filled++
    else missing.push({ code: def.code, label: def.label })
  }
  const total = required.length
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100)
  return { requiredTotal: total, requiredFilled: filled, percent, missing }
}

// ------------------------------------------------------------
// FAMILIAS
// ------------------------------------------------------------
const listFamilies = async () => {
  const { data, error } = await supabase
    .from('pim_family')
    .select('id, code, name, created_at, pim_attribute ( id )')
    .order('name', { ascending: true })

  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las familias')

  return data.map(f => ({
    id: f.id,
    code: f.code,
    name: f.name,
    attributeCount: (f.pim_attribute ?? []).length
  }))
}

const getFamily = async ({ id }) => {
  const { data, error } = await supabase
    .from('pim_family')
    .select(
      'id, code, name, created_at, pim_attribute ( id, code, label, type, required, unit, options, position )'
    )
    .eq('id', id)
    .single()

  if (error || !data) throw new AppError(HTTP_STATUS.notFound, 'Familia no encontrada')

  const attributes = (data.pim_attribute ?? []).sort((a, b) => a.position - b.position)
  return { id: data.id, code: data.code, name: data.name, attributes }
}

const createFamily = async ({ code, name }) => {
  const { data, error } = await supabase
    .from('pim_family')
    .insert({ code, name })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') throw new AppError(HTTP_STATUS.conflict, 'Ya existe una familia con ese code')
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la familia')
  }
  return getFamily({ id: data.id })
}

const updateFamily = async ({ id, code, name }) => {
  const patch = {}
  if (code !== undefined) patch.code = code
  if (name !== undefined) patch.name = name
  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('pim_family').update(patch).eq('id', id)
    if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar la familia')
  }
  return getFamily({ id })
}

const deleteFamily = async ({ id }) => {
  const { error } = await supabase.from('pim_family').delete().eq('id', id)
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la familia')
}

// ------------------------------------------------------------
// ATRIBUTOS
// ------------------------------------------------------------
const createAttribute = async ({ familyId, ...body }) => {
  const { error } = await supabase
    .from('pim_attribute')
    .insert({ family_id: familyId, ...body })

  if (error) {
    if (error.code === '23505')
      throw new AppError(HTTP_STATUS.conflict, 'Ya existe un atributo con ese code en la familia')
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear el atributo')
  }
  return getFamily({ id: familyId })
}

const updateAttribute = async ({ id, ...body }) => {
  const patch = {}
  for (const key of ['code', 'label', 'type', 'required', 'unit', 'options', 'position']) {
    if (body[key] !== undefined) patch[key] = body[key]
  }
  const { data, error } = await supabase
    .from('pim_attribute')
    .update(patch)
    .eq('id', id)
    .select('family_id')
    .single()

  if (error || !data) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el atributo')
  return getFamily({ id: data.family_id })
}

const deleteAttribute = async ({ id }) => {
  const { data } = await supabase.from('pim_attribute').select('family_id').eq('id', id).single()
  const { error } = await supabase.from('pim_attribute').delete().eq('id', id)
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el atributo')
  return data ? getFamily({ id: data.family_id }) : null
}

// ------------------------------------------------------------
// PRODUCTOS
// ------------------------------------------------------------
const PRODUCT_BASE = `
  id, name, description, price, stock, sku, ean, brand, supplier,
  pim_status, attributes, created_at,
  category:category_id ( id, name, parent_id ),
  family:family_id ( id, code, name )
`

// Carga las definiciones de atributos indexadas por familia (para completitud).
async function loadAttrDefsByFamily() {
  const { data } = await supabase
    .from('pim_attribute')
    .select('id, family_id, code, label, type, required, unit, options, position')
    .order('position', { ascending: true })
  const map = new Map()
  for (const a of data ?? []) {
    if (!map.has(a.family_id)) map.set(a.family_id, [])
    map.get(a.family_id).push(a)
  }
  return map
}

const listProducts = async ({ search, status, familyId, supplier } = {}) => {
  let query = supabase.from('product').select(PRODUCT_BASE)
  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('pim_status', status)
  if (familyId) query = query.eq('family_id', familyId)
  if (supplier) query = query.eq('supplier', supplier)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los productos')

  const attrDefs = await loadAttrDefsByFamily()

  // Conteos de variantes por producto (una consulta).
  const { data: variantRows } = await supabase.from('product_variant').select('product_id')
  const variantCount = new Map()
  for (const v of variantRows ?? [])
    variantCount.set(v.product_id, (variantCount.get(v.product_id) ?? 0) + 1)

  // Conteos de imágenes por producto (para semáforo de readiness).
  const { data: assetRows } = await supabase
    .from('product_asset')
    .select('product_id, asset:asset_id ( type )')
  const imageCount = new Map()
  for (const r of assetRows ?? []) {
    if (r.asset?.type === 'image')
      imageCount.set(r.product_id, (imageCount.get(r.product_id) ?? 0) + 1)
  }

  return data.map(row => {
    const defs = row.family ? (attrDefs.get(row.family.id) ?? []) : []
    const completeness = computeCompleteness(defs, row.attributes)
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      brand: row.brand,
      supplier: row.supplier,
      price: row.price,
      stock: row.stock,
      status: row.pim_status,
      categoryName: row.category?.name ?? null,
      familyId: row.family?.id ?? null,
      familyName: row.family?.name ?? null,
      variantCount: variantCount.get(row.id) ?? 0,
      imageCount: imageCount.get(row.id) ?? 0,
      completeness
    }
  })
}

const getProduct = async ({ id }) => {
  const { data: row, error } = await supabase
    .from('product')
    .select(PRODUCT_BASE)
    .eq('id', id)
    .single()

  if (error || !row) throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')

  // Definiciones de atributos de su familia.
  let attributeDefs = []
  if (row.family?.id) {
    const { data } = await supabase
      .from('pim_attribute')
      .select('id, code, label, type, required, unit, options, position')
      .eq('family_id', row.family.id)
      .order('position', { ascending: true })
    attributeDefs = data ?? []
  }

  // Variantes.
  const { data: variants } = await supabase
    .from('product_variant')
    .select('id, sku, ean, name, price, stock, attributes, position')
    .eq('product_id', id)
    .order('position', { ascending: true })

  // Activos vinculados (DAM).
  const { data: assetLinks } = await supabase
    .from('product_asset')
    .select('role, position, asset:asset_id ( id, name, file_key, type, mime, tags )')
    .eq('product_id', id)
    .order('position', { ascending: true })

  const assets = (assetLinks ?? []).map(l => ({
    id: l.asset?.id,
    name: l.asset?.name,
    type: l.asset?.type,
    mime: l.asset?.mime,
    tags: l.asset?.tags ?? [],
    url: assetUrl(l.asset?.file_key),
    role: l.role,
    position: l.position
  }))

  const completeness = computeCompleteness(attributeDefs, row.attributes)
  const imageCount = assets.filter(a => a.type === 'image').length

  // Readiness para publicar (base + completitud + al menos una imagen).
  const reasons = []
  if (!row.name) reasons.push('Falta nombre')
  if (!row.sku) reasons.push('Falta SKU')
  if (!(row.price > 0)) reasons.push('Falta precio')
  if (imageCount < 1) reasons.push('Falta al menos una imagen')
  if (completeness.percent < 100)
    reasons.push('Atributos obligatorios incompletos: ' + completeness.missing.map(m => m.label).join(', '))
  const readiness = { ready: reasons.length === 0, reasons }

  // Estado por canal (mezcla los canales existentes con lo publicado).
  const channels = await getProductChannels({ productId: id })

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sku: row.sku,
    ean: row.ean,
    brand: row.brand,
    supplier: row.supplier,
    price: row.price,
    stock: row.stock,
    status: row.pim_status,
    categoryId: row.category?.id ?? null,
    categoryName: row.category?.name ?? null,
    familyId: row.family?.id ?? null,
    familyName: row.family?.name ?? null,
    attributes: attributeDefs.map(def => ({
      id: def.id,
      code: def.code,
      label: def.label,
      type: def.type,
      required: def.required,
      unit: def.unit,
      options: def.options ?? [],
      value: row.attributes?.[def.code] ?? null
    })),
    // valores crudos guardados aunque no exista definición (histórico de import)
    rawAttributes: row.attributes ?? {},
    variants: variants ?? [],
    assets,
    completeness,
    readiness,
    channels
  }
}

async function replaceVariants(productId, variants) {
  await supabase.from('product_variant').delete().eq('product_id', productId)
  if (!Array.isArray(variants) || variants.length === 0) return
  const rows = variants.map((v, idx) => ({
    product_id: productId,
    sku: v.sku ?? null,
    ean: v.ean ?? null,
    name: v.name,
    price: v.price ?? null,
    stock: v.stock ?? 0,
    attributes: v.attributes ?? {},
    position: v.position ?? idx
  }))
  const { error } = await supabase.from('product_variant').insert(rows)
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron guardar las variantes')
}

const createProduct = async (payload) => {
  const { data, error } = await supabase
    .from('product')
    .insert({
      name: payload.name,
      description: payload.description ?? '',
      category_id: payload.categoryId,
      family_id: payload.familyId ?? null,
      price: payload.price ?? 0,
      stock: payload.stock ?? 0,
      sku: payload.sku ?? null,
      ean: payload.ean ?? null,
      brand: payload.brand ?? null,
      supplier: payload.supplier ?? null,
      pim_status: payload.status ?? 'draft',
      attributes: payload.attributes ?? {}
    })
    .select('id')
    .single()

  if (error || !data) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear el producto')

  if (payload.variants) await replaceVariants(data.id, payload.variants)
  return getProduct({ id: data.id })
}

const updateProduct = async ({ id, ...payload }) => {
  const patch = {}
  if (payload.name !== undefined) patch.name = payload.name
  if (payload.description !== undefined) patch.description = payload.description
  if (payload.categoryId !== undefined) patch.category_id = payload.categoryId
  if (payload.familyId !== undefined) patch.family_id = payload.familyId ?? null
  if (payload.price !== undefined) patch.price = payload.price ?? 0
  if (payload.stock !== undefined) patch.stock = payload.stock ?? 0
  if (payload.sku !== undefined) patch.sku = payload.sku ?? null
  if (payload.ean !== undefined) patch.ean = payload.ean ?? null
  if (payload.brand !== undefined) patch.brand = payload.brand ?? null
  if (payload.supplier !== undefined) patch.supplier = payload.supplier ?? null
  if (payload.status !== undefined) patch.pim_status = payload.status
  if (payload.attributes !== undefined) patch.attributes = payload.attributes

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('product').update(patch).eq('id', id)
    if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el producto')
  }
  if (payload.variants !== undefined) await replaceVariants(id, payload.variants)
  return getProduct({ id })
}

const deleteProduct = async ({ id }) => {
  // product_variant / product_asset / product_channel caen por ON DELETE CASCADE.
  // product_image (storefront) se limpia igual que en el servicio original.
  await supabase.from('product_image').delete().eq('product_id', id)
  const { error } = await supabase.from('product').delete().eq('id', id)
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el producto')
}

// ------------------------------------------------------------
// CANALES + SINDICACIÓN
// ------------------------------------------------------------
const listChannels = async () => {
  const { data, error } = await supabase
    .from('pim_channel')
    .select('id, code, name, kind, config, created_at')
    .order('name', { ascending: true })
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los canales')
  return data
}

const getProductChannels = async ({ productId }) => {
  const channels = await listChannels()
  const { data: statuses } = await supabase
    .from('product_channel')
    .select('channel_id, status, external_id, message, published_at')
    .eq('product_id', productId)
  const byChannel = new Map((statuses ?? []).map(s => [s.channel_id, s]))
  return channels.map(c => {
    const s = byChannel.get(c.id)
    return {
      channelId: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
      status: s?.status ?? 'pending',
      externalId: s?.external_id ?? null,
      message: s?.message ?? null,
      publishedAt: s?.published_at ?? null
    }
  })
}

async function upsertProductChannel(productId, channelId, fields) {
  const { error } = await supabase
    .from('product_channel')
    .upsert(
      { product_id: productId, channel_id: channelId, ...fields },
      { onConflict: 'product_id,channel_id' }
    )
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el estado del canal')
}

const setProductChannelStatus = async ({ productId, channelId, status }) => {
  await upsertProductChannel(productId, channelId, { status })
  return getProductChannels({ productId })
}

// Sindica (publica) un producto en un canal. Exige que la ficha esté lista.
// Punto de integración: si el canal es de tipo 'shopify', aquí se invocaría el
// conector Shopify existente (shopify-admin.service.js) para crear/actualizar
// el producto vía Admin API. En la demo se marca como publicado.
const syndicate = async ({ productId, channelId }) => {
  const product = await getProduct({ id: productId })
  if (!product.readiness.ready) {
    throw new AppError(
      HTTP_STATUS.conflict,
      'La ficha no está lista para publicar: ' + product.readiness.reasons.join('; ')
    )
  }

  const channel = product.channels.find(c => c.channelId === channelId)
  if (!channel) throw new AppError(HTTP_STATUS.notFound, 'Canal no encontrado')

  // --- Aquí iría el push real al canal ---
  // if (channel.kind === 'shopify') { externalId = await shopifyAdmin.upsertProduct(...) }
  const externalId = channel.kind === 'shopify' ? `demo-gid://shopify/Product/${Date.now()}` : null

  await upsertProductChannel(productId, channelId, {
    status: 'published',
    external_id: externalId,
    message: 'Publicado desde el PIM',
    published_at: new Date().toISOString()
  })

  return {
    channelId,
    channel: channel.name,
    status: 'published',
    externalId,
    // payload que se enviaría al canal (útil para depurar / feed genérico)
    payload: buildChannelPayload(product)
  }
}

// Representación canal-agnóstica del producto (lo que se sindicaría).
function buildChannelPayload(product) {
  return {
    title: product.name,
    body_html: product.description,
    vendor: product.brand,
    sku: product.sku,
    barcode: product.ean,
    price: product.price,
    inventory_quantity: product.stock,
    product_type: product.familyName,
    metafields: product.attributes
      .filter(a => a.value !== null && a.value !== '')
      .map(a => ({ key: a.code, value: a.value, unit: a.unit })),
    variants: product.variants.map(v => ({
      title: v.name,
      sku: v.sku,
      price: v.price ?? product.price,
      inventory_quantity: v.stock
    })),
    images: product.assets.filter(a => a.type === 'image').map(a => a.url)
  }
}

// ------------------------------------------------------------
// CATEGORÍAS (con jerarquía) — para los selects del PIM
// ------------------------------------------------------------
const listCategories = async () => {
  const { data, error } = await supabase
    .from('category')
    .select('id, name, parent_id')
    .order('name', { ascending: true })
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las categorías')

  const byId = new Map(data.map(c => [c.id, c]))
  // path: "Padre › Hijo" para mostrar la jerarquía en un select plano.
  return data.map(c => {
    const parts = [c.name]
    let cur = c
    const seen = new Set([c.id])
    while (cur.parent_id && byId.has(cur.parent_id) && !seen.has(cur.parent_id)) {
      cur = byId.get(cur.parent_id)
      parts.unshift(cur.name)
      seen.add(cur.id)
    }
    return { id: c.id, name: c.name, parentId: c.parent_id, path: parts.join(' › ') }
  })
}

// ------------------------------------------------------------
// ESTADÍSTICAS (dashboard)
// ------------------------------------------------------------
const getStats = async () => {
  const products = await listProducts()
  const byStatus = { draft: 0, review: 0, approved: 0, published: 0 }
  let sumCompleteness = 0
  for (const p of products) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
    sumCompleteness += p.completeness.percent
  }
  const avgCompleteness = products.length
    ? Math.round(sumCompleteness / products.length)
    : 0

  const [{ count: familyCount }, { count: attrCount }, { count: assetCount }, { count: variantCount }] =
    await Promise.all([
      supabase.from('pim_family').select('*', { count: 'exact', head: true }),
      supabase.from('pim_attribute').select('*', { count: 'exact', head: true }),
      supabase.from('asset').select('*', { count: 'exact', head: true }),
      supabase.from('product_variant').select('*', { count: 'exact', head: true })
    ])

  // Publicados por canal.
  const channels = await listChannels()
  const { data: pcRows } = await supabase.from('product_channel').select('channel_id, status')
  const channelStats = channels.map(c => {
    const rows = (pcRows ?? []).filter(r => r.channel_id === c.id)
    return {
      name: c.name,
      published: rows.filter(r => r.status === 'published').length,
      ready: rows.filter(r => r.status === 'ready').length,
      pending: rows.filter(r => r.status === 'pending').length
    }
  })

  return {
    products: { total: products.length, byStatus },
    avgCompleteness,
    families: familyCount ?? 0,
    attributes: attrCount ?? 0,
    assets: assetCount ?? 0,
    variants: variantCount ?? 0,
    channels: channelStats
  }
}

export {
  // familias / atributos
  listFamilies,
  getFamily,
  createFamily,
  updateFamily,
  deleteFamily,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  // productos
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // canales
  listChannels,
  getProductChannels,
  setProductChannelStatus,
  syndicate,
  // categorías
  listCategories,
  // stats
  getStats,
  // helpers reutilizables
  computeCompleteness
}

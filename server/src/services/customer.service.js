import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Cuenta unificada del marketplace. UN customer puede COMPRAR y VENDER a la
// vez (estilo Temu/AliExpress). Nace como comprador; pasa a vendedor en cuanto
// abre su tienda (auto-aprobado, sin revisión de admin).

// Campos públicos del cliente que se exponen en sesión / respuestas.
const CUSTOMER_PUBLIC =
  'id, email, name, is_seller, store_name, store_slug, store_bio, seller_since'

// Crea un cliente. La contraseña llega YA hasheada desde el controller.
const createCustomer = async ({ email, password, name }) => {
  const { data, error } = await supabase
    .from('customer')
    .insert({ email, password, name: name ?? null })
    .select(CUSTOMER_PUBLIC)
    .single()

  if (error) console.error('createCustomer Supabase error >>>', error) // TEMP

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'Ese email ya está registrado')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la cuenta')
  }

  return data
}

// Trae un cliente por email (incluye el hash de password, lo usa el login).
const getCustomerByEmail = async ({ email }) => {
  const { data, error } = await supabase
    .from('customer')
    .select(`${CUSTOMER_PUBLIC}, password`)
    .eq('email', email)
    .limit(1)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Cliente no encontrado')
  }

  return data
}

// Trae un cliente por id (datos públicos). Lo usa /auth/verify para refrescar
// el estado de vendedor sin que el usuario tenga que volver a loguearse.
const getCustomerById = async ({ id }) => {
  const { data, error } = await supabase
    .from('customer')
    .select(CUSTOMER_PUBLIC)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Cliente no encontrado')
  }

  return data
}

// Genera un slug a partir del nombre de tienda: minúsculas, sin acentos,
// espacios -> guiones, solo [a-z0-9-]. Ej: "Tienda Pérez 2" -> "tienda-perez-2".
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Convierte una cuenta en vendedora (o actualiza su perfil de tienda). Es
// idempotente: si ya es vendedor, actualiza los datos. Auto-aprobado: queda
// activo al instante.
const becomeSeller = async ({ customerId, storeName, storeBio, payout }) => {
  let baseSlug = slugify(storeName)
  if (!baseSlug) baseSlug = `tienda-${customerId.slice(0, 8)}`

  // Resuelve colisiones de slug agregando sufijo numérico.
  let slug = baseSlug
  let suffix = 1
  // Lee si la cuenta ya tenía slug (para no chocar consigo misma).
  const { data: current } = await supabase
    .from('customer')
    .select('store_slug, is_seller, seller_since')
    .eq('id', customerId)
    .single()

  // Si ya tiene slug y el nombre no cambió de raíz, conserva el suyo.
  const keepOwnSlug = current?.store_slug && current.store_slug.startsWith(baseSlug)

  if (!keepOwnSlug) {
    // Busca un slug libre.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: taken } = await supabase
        .from('customer')
        .select('id')
        .eq('store_slug', slug)
        .neq('id', customerId)
        .maybeSingle()
      if (!taken) break
      suffix += 1
      slug = `${baseSlug}-${suffix}`
    }
  } else {
    slug = current.store_slug
  }

  const update = {
    is_seller: true,
    store_name: storeName,
    store_slug: slug,
    store_bio: storeBio ?? null,
    seller_since: current?.seller_since ?? new Date().toISOString()
  }

  if (payout) {
    update.payout_bank = payout.bank ?? null
    update.payout_account_type = payout.accountType ?? null
    update.payout_account_number = payout.accountNumber ?? null
    update.payout_holder_name = payout.holderName ?? null
    update.payout_holder_doc = payout.holderDoc ?? null
  }

  const { data, error } = await supabase
    .from('customer')
    .update(update)
    .eq('id', customerId)
    .select(CUSTOMER_PUBLIC)
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'Ese nombre de tienda ya está en uso')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo abrir la tienda')
  }

  return data
}

// Trae los datos de pago (payout) del vendedor. Solo el propio vendedor.
const getSellerPayoutInfo = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('customer')
    .select(
      'payout_bank, payout_account_type, payout_account_number, payout_holder_name, payout_holder_doc'
    )
    .eq('id', customerId)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Datos no encontrados')
  }

  return {
    bank: data.payout_bank,
    accountType: data.payout_account_type,
    accountNumber: data.payout_account_number,
    holderName: data.payout_holder_name,
    holderDoc: data.payout_holder_doc
  }
}

// Perfil PÚBLICO de una tienda por su slug (lo ve cualquiera). Sin datos
// sensibles ni de pago.
const getStoreBySlug = async ({ slug }) => {
  const { data, error } = await supabase
    .from('customer')
    .select('id, name, store_name, store_slug, store_bio, seller_since')
    .eq('store_slug', slug)
    .eq('is_seller', true)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Tienda no encontrada')
  }

  return {
    id: data.id,
    storeName: data.store_name,
    storeSlug: data.store_slug,
    storeBio: data.store_bio,
    sellerSince: data.seller_since
  }
}

// Lista todas las tiendas (para un directorio de vendedores y para el admin).
const listStores = async () => {
  const { data, error } = await supabase
    .from('customer')
    .select('id, store_name, store_slug, store_bio, seller_since, email')
    .eq('is_seller', true)
    .order('seller_since', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las tiendas')
  }

  return (data ?? []).map(s => ({
    id: s.id,
    storeName: s.store_name,
    storeSlug: s.store_slug,
    storeBio: s.store_bio,
    sellerSince: s.seller_since,
    email: s.email
  }))
}

export {
  createCustomer,
  getCustomerByEmail,
  getCustomerById,
  becomeSeller,
  getSellerPayoutInfo,
  getStoreBySlug,
  listStores
}

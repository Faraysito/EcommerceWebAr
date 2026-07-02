import { z } from 'zod'

// Esquemas de validación del PIM. Mismo estilo que el resto del backend:
// z.uuidv4() para ids, parse en los controllers.

const PIM_STATUS = ['draft', 'review', 'approved', 'published']
const ATTR_TYPES = ['text', 'number', 'select', 'boolean', 'date']
const ASSET_TYPES = ['image', 'model', 'document', 'video']
const CHANNEL_STATUS = ['pending', 'ready', 'published', 'error']

// --- Familias ---
export const familyBodySchema = z.object({
  code: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/, 'code: solo minúsculas, números, guion y guion bajo'),
  name: z.string().min(1)
})

// --- Atributos ---
export const attributeBodySchema = z.object({
  code: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, 'code: solo minúsculas, números y guion bajo'),
  label: z.string().min(1),
  type: z.enum(ATTR_TYPES).default('text'),
  required: z.boolean().default(false),
  unit: z.string().optional().nullable(),
  options: z.array(z.string()).default([]),
  position: z.number().int().min(0).default(0)
})

// --- Variantes (embebidas en el producto) ---
const variantSchema = z.object({
  sku: z.string().optional().nullable(),
  ean: z.string().optional().nullable(),
  name: z.string().min(1),
  price: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.any()).default({}),
  position: z.number().int().min(0).default(0)
})

// --- Producto (crear) ---
export const productBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  categoryId: z.uuidv4(),
  familyId: z.uuidv4().nullable().optional(),
  sku: z.string().optional().nullable(),
  ean: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  price: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
  status: z.enum(PIM_STATUS).default('draft'),
  attributes: z.record(z.string(), z.any()).default({}),
  variants: z.array(variantSchema).optional()
})

// --- Activos (DAM) ---
export const assetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

export const assetLinkSchema = z.object({
  assetId: z.uuidv4(),
  role: z.enum(['gallery', 'main', 'model', 'datasheet']).default('gallery'),
  position: z.number().int().min(0).default(0)
})

// --- Canales ---
export const channelStatusSchema = z.object({
  channelId: z.uuidv4(),
  status: z.enum(CHANNEL_STATUS)
})

// --- Import CSV ---
export const importCommitSchema = z.object({
  familyId: z.uuidv4().nullable().optional(),
  categoryId: z.uuidv4(),
  supplier: z.string().optional().nullable(),
  status: z.enum(PIM_STATUS).default('draft'),
  // mapping: campo destino -> nombre de columna del CSV
  mapping: z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    ean: z.string().optional(),
    brand: z.string().optional(),
    price: z.string().optional(),
    stock: z.string().optional(),
    description: z.string().optional(),
    // atributos: code del atributo -> columna del CSV
    attributes: z.record(z.string(), z.string()).default({})
  }),
  rows: z.array(z.record(z.string(), z.string())).min(1)
})

export { PIM_STATUS, ATTR_TYPES, ASSET_TYPES, CHANNEL_STATUS }

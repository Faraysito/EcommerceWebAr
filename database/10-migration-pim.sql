-- ============================================================
-- Migración: PIM + DAM propietario (Weseller)
--
-- Convierte el catálogo del marketplace en un PIM (fuente única de verdad,
-- agnóstica al canal) + DAM (activos digitales). Correr en el SQL Editor de
-- Supabase DESPUÉS de:
--   01-schema.sql ... 09-migration-shopify-product-model.sql
--
-- Es 100% aditiva: no borra ni renombra nada del storefront existente.
--
-- Resumen:
--   1. pim_family      -> conjunto de atributos por tipo de producto (familia)
--   2. pim_attribute   -> definición de cada atributo (tipo, obligatorio, opciones)
--   3. product (ext)   -> sku, ean, brand, supplier, family_id, attributes(jsonb),
--                         pim_status (draft/review/approved/published)
--   4. category (ext)  -> parent_id (categorías jerárquicas)
--   5. product_variant -> variantes por producto (sku/ean/precio/stock/atributos)
--   6. asset           -> DAM: imagen/modelo/documento(PDF)/video + tags + metadata
--   7. product_asset   -> relación N:M producto <-> activo
--   8. pim_channel     -> canales de salida (Shopify Correos, genérico, etc.)
--   9. product_channel -> estado de sindicación por producto y canal
--  10. permiso pim.access + asignación al rol admin
--
-- NOTA RLS: igual que el resto del proyecto, el backend usa la service_role
-- key que bypasea RLS. RLS habilitado sin políticas: nadie toca la BD directo.
-- ============================================================


-- ------------------------------------------------------------
-- 1. FAMILIAS (conjuntos de atributos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "pim_family" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"       text UNIQUE NOT NULL,   -- identificador estable (ej. 'electronica')
  "name"       text NOT NULL,          -- nombre visible
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);
ALTER TABLE "pim_family" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 2. ATRIBUTOS (definición del esquema flexible por familia)
-- ------------------------------------------------------------
-- type controla cómo se renderiza y valida el atributo. options (jsonb array)
-- solo aplica a type='select'. Los VALORES se guardan en product.attributes
-- (jsonb keyeado por code), patrón PIM pragmático: esquema normalizado, valores
-- en jsonb.
CREATE TABLE IF NOT EXISTS "pim_attribute" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id"  uuid NOT NULL,
  "code"       text NOT NULL,          -- clave dentro de product.attributes
  "label"      text NOT NULL,          -- etiqueta visible
  "type"       text NOT NULL DEFAULT 'text'
               CHECK ("type" IN ('text','number','select','boolean','date')),
  "required"   boolean NOT NULL DEFAULT false,
  "unit"       text,                   -- ej. 'W', 'cm', 'kg' (opcional)
  "options"    jsonb NOT NULL DEFAULT '[]'::jsonb, -- para type='select'
  "position"   int NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  UNIQUE ("family_id", "code")
);
ALTER TABLE "pim_attribute"
  ADD CONSTRAINT "pim_attribute_family_fkey"
  FOREIGN KEY ("family_id") REFERENCES "pim_family" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_pim_attribute_family" ON "pim_attribute" ("family_id");
ALTER TABLE "pim_attribute" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 3. PRODUCT: campos PIM
-- ------------------------------------------------------------
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "sku"        text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "ean"        text;   -- EAN/GTIN
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "brand"      text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "supplier"   text;   -- importador de origen
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "family_id"  uuid;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "pim_status" text NOT NULL DEFAULT 'draft';

-- Estado editorial (workflow). CHECK vía constraint idempotente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'product_pim_status_check'
  ) THEN
    ALTER TABLE "product"
      ADD CONSTRAINT "product_pim_status_check"
      CHECK ("pim_status" IN ('draft','review','approved','published'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_family_id_fkey'
  ) THEN
    ALTER TABLE "product"
      ADD CONSTRAINT "product_family_id_fkey"
      FOREIGN KEY ("family_id") REFERENCES "pim_family" ("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_product_sku"        ON "product" ("sku");
CREATE INDEX IF NOT EXISTS "idx_product_family_id"  ON "product" ("family_id");
CREATE INDEX IF NOT EXISTS "idx_product_pim_status" ON "product" ("pim_status");
CREATE INDEX IF NOT EXISTS "idx_product_supplier"   ON "product" ("supplier");


-- ------------------------------------------------------------
-- 4. CATEGORY: jerarquía
-- ------------------------------------------------------------
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'category_parent_id_fkey'
  ) THEN
    ALTER TABLE "category"
      ADD CONSTRAINT "category_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "category" ("id") ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "idx_category_parent_id" ON "category" ("parent_id");


-- ------------------------------------------------------------
-- 5. VARIANTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "product_variant" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "sku"        text,
  "ean"        text,
  "name"       text NOT NULL,          -- ej. "Talla M / Azul"
  "price"      int,
  "stock"      int NOT NULL DEFAULT 0,
  "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb, -- ej. {"talla":"M","color":"Azul"}
  "position"   int NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);
ALTER TABLE "product_variant"
  ADD CONSTRAINT "product_variant_product_fkey"
  FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_product_variant_product" ON "product_variant" ("product_id");
ALTER TABLE "product_variant" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 6. DAM: ASSET (activos digitales de cualquier tipo)
-- ------------------------------------------------------------
-- Coexiste con las tablas image/model del storefront (no las toca). El PIM/DAM
-- usa esta tabla unificada, que además soporta PDF (ficha técnica) y video.
CREATE TABLE IF NOT EXISTS "asset" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text NOT NULL,
  "file_key"   text UNIQUE NOT NULL,   -- ruta en Supabase Storage
  "type"       text NOT NULL DEFAULT 'image'
               CHECK ("type" IN ('image','model','document','video')),
  "mime"       text,
  "size_bytes" bigint,
  "tags"       text[] NOT NULL DEFAULT '{}',
  "metadata"   jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);
CREATE INDEX IF NOT EXISTS "idx_asset_type" ON "asset" ("type");
CREATE INDEX IF NOT EXISTS "idx_asset_tags" ON "asset" USING gin ("tags");
ALTER TABLE "asset" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 7. PRODUCT_ASSET (N:M producto <-> activo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "product_asset" (
  "product_id" uuid NOT NULL,
  "asset_id"   uuid NOT NULL,
  "role"       text NOT NULL DEFAULT 'gallery', -- gallery | main | model | datasheet
  "position"   int NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("product_id", "asset_id")
);
ALTER TABLE "product_asset"
  ADD CONSTRAINT "product_asset_product_fkey"
  FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE;
ALTER TABLE "product_asset"
  ADD CONSTRAINT "product_asset_asset_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_product_asset_product" ON "product_asset" ("product_id");
ALTER TABLE "product_asset" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 8. CANALES DE SALIDA (sindicación)
-- ------------------------------------------------------------
-- Un canal es un destino donde se publica el catálogo. kind determina el
-- adaptador (shopify usa el conector Shopify existente; generic exporta feed).
CREATE TABLE IF NOT EXISTS "pim_channel" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"       text UNIQUE NOT NULL,
  "name"       text NOT NULL,
  "kind"       text NOT NULL DEFAULT 'generic'
               CHECK ("kind" IN ('shopify','generic')),
  "config"     jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);
ALTER TABLE "pim_channel" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 9. PRODUCT_CHANNEL (estado de sindicación por producto/canal)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "product_channel" (
  "product_id"   uuid NOT NULL,
  "channel_id"   uuid NOT NULL,
  "status"       text NOT NULL DEFAULT 'pending'
                 CHECK ("status" IN ('pending','ready','published','error')),
  "external_id"  text,                 -- id del producto en el canal (ej. GID Shopify)
  "message"      text,
  "published_at" timestamp,
  "created_at"   timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("product_id", "channel_id")
);
ALTER TABLE "product_channel"
  ADD CONSTRAINT "product_channel_product_fkey"
  FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE;
ALTER TABLE "product_channel"
  ADD CONSTRAINT "product_channel_channel_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "pim_channel" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_product_channel_channel" ON "product_channel" ("channel_id");
ALTER TABLE "product_channel" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 10. Permiso de acceso al PIM
-- ------------------------------------------------------------
INSERT INTO "permission" ("name") VALUES ('pim.access')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "role" r
CROSS JOIN "permission" p
WHERE r."name" = 'admin' AND p."name" = 'pim.access'
ON CONFLICT DO NOTHING;

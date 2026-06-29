-- ============================================================
-- Migración: HERRAMIENTA AR (embed para tiendas externas)
--
-- Correr en el SQL Editor de Supabase DESPUÉS de:
--   01-schema.sql ... 06-migration-reviews-wishlist-addresses.sql
--
-- Cambios:
--   1. product -> gana width_cm / height_cm / depth_cm (medidas reales para AR)
--   2. price y stock pasan a opcionales (la herramienta no los necesita; los
--      pone Shopify). Se mantienen para no romper el marketplace existente.
--   3. model_view -> tabla nueva: contador de aperturas del visor por producto
-- ============================================================

-- ------------------------------------------------------------
-- 1. Medidas reales del producto (centímetros)
-- ------------------------------------------------------------
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "width_cm"  numeric;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "height_cm" numeric;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "depth_cm"  numeric;

-- ------------------------------------------------------------
-- 2. price / stock opcionales
-- ------------------------------------------------------------
-- Para la herramienta AR el producto es: nombre + modelo + medidas. Quitamos
-- el NOT NULL y damos default 0 para que los productos nuevos no requieran
-- precio/stock. Los existentes del marketplace quedan intactos.
ALTER TABLE "product" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "product" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "product" ALTER COLUMN "stock" DROP NOT NULL;
ALTER TABLE "product" ALTER COLUMN "stock" SET DEFAULT 0;

-- ------------------------------------------------------------
-- 3. Contador de vistas AR
-- ------------------------------------------------------------
-- Una fila por producto. views se incrementa cada vez que se abre /ver/:id.
CREATE TABLE IF NOT EXISTS "model_view" (
  "product_id" uuid PRIMARY KEY,
  "views" int NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT current_timestamp
);

ALTER TABLE "model_view" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE;
ALTER TABLE "model_view" ENABLE ROW LEVEL SECURITY;

-- Incremento atómico (evita condiciones de carrera). El backend la llama vía RPC.
CREATE OR REPLACE FUNCTION increment_model_view(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "model_view" ("product_id", "views", "updated_at")
  VALUES (p_product_id, 1, current_timestamp)
  ON CONFLICT ("product_id")
  DO UPDATE SET "views" = "model_view"."views" + 1, "updated_at" = current_timestamp;
END;
$$;

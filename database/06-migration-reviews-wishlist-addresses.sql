-- ============================================================
-- Migración: RESEÑAS + WISHLIST + DIRECCIONES + DIMENSIONES AR
--
-- Correr en el SQL Editor de Supabase DESPUÉS de:
--   01-schema.sql, 02-test-values.sql, 03-migration-sales.sql,
--   04-migration-sales-webpay.sql, 05-migration-marketplace.sql
--
-- Resumen de cambios:
--   1. review            -> reseñas y calificación (1-5) por producto, hechas
--                           por un comprador. UNIQUE(product_id, customer_id):
--                           una reseña por persona por producto.
--   2. wishlist          -> favoritos del comprador (relación customer-product).
--   3. customer_address  -> direcciones de despacho del comprador.
--   4. product           -> gana dimensiones (cm) y peso (g) para AR a escala
--                           real y para mostrar medidas en la ficha.
--   5. permisos nuevos   -> review.read / review.delete para moderación admin.
--
-- NOTA RLS: igual que el resto del proyecto, el backend usa la service_role
-- key que bypasea RLS. Mantenemos RLS habilitado sin políticas: nadie toca la
-- BD directo, todo pasa por el backend.
-- ============================================================


-- ------------------------------------------------------------
-- 1. REVIEW: reseñas y calificación por producto
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "review" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "rating" int NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" text,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  UNIQUE ("product_id", "customer_id")  -- una reseña por persona por producto
);

ALTER TABLE "review" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id");
ALTER TABLE "review" ADD FOREIGN KEY ("customer_id") REFERENCES "customer" ("id");

CREATE INDEX IF NOT EXISTS "idx_review_product_id" ON "review" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_review_customer_id" ON "review" ("customer_id");

ALTER TABLE "review" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 2. WISHLIST: favoritos del comprador
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "wishlist" (
  "customer_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("customer_id", "product_id")
);

ALTER TABLE "wishlist" ADD FOREIGN KEY ("customer_id") REFERENCES "customer" ("id");
ALTER TABLE "wishlist" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id");

CREATE INDEX IF NOT EXISTS "idx_wishlist_customer_id" ON "wishlist" ("customer_id");

ALTER TABLE "wishlist" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 3. CUSTOMER_ADDRESS: direcciones de despacho del comprador
-- ------------------------------------------------------------
-- is_default marca la dirección preferida. La lógica de "solo una default por
-- cliente" la maneja el backend (al marcar una, desmarca el resto).
CREATE TABLE IF NOT EXISTS "customer_address" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL,
  "label" text,                 -- ej. "Casa", "Trabajo"
  "recipient" text NOT NULL,    -- a nombre de quién
  "phone" text,
  "region" text,
  "commune" text,               -- comuna (Chile)
  "address_line" text NOT NULL, -- calle y número
  "extra" text,                 -- depto, referencia
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

ALTER TABLE "customer_address" ADD FOREIGN KEY ("customer_id") REFERENCES "customer" ("id");

CREATE INDEX IF NOT EXISTS "idx_customer_address_customer_id"
  ON "customer_address" ("customer_id");

ALTER TABLE "customer_address" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 4. PRODUCT: dimensiones y peso (para AR a escala real + ficha)
-- ------------------------------------------------------------
-- Medidas en centímetros y peso en gramos. Todas opcionales: si el vendedor no
-- las llena, el visor AR usa el tamaño nativo del modelo .glb.
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "width_cm"  numeric;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "height_cm" numeric;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "depth_cm"  numeric;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "weight_g"  numeric;


-- ------------------------------------------------------------
-- 5. Permisos nuevos para moderación de reseñas (admin)
-- ------------------------------------------------------------
INSERT INTO "permission" ("name") VALUES
  ('review.read'), ('review.delete')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "role" r
CROSS JOIN "permission" p
WHERE r."name" = 'admin'
  AND p."name" IN ('review.read', 'review.delete')
ON CONFLICT DO NOTHING;

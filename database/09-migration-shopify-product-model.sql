-- ============================================================
-- Migración: SHOPIFY producto <-> modelo AR (Etapa 3)
--
-- Correr en el SQL Editor de Supabase DESPUÉS de:
--   01-schema.sql ... 08-migration-shopify.sql
--
-- Cambios:
--   1. shopify_product_model -> tabla nueva: asocia un producto de Shopify
--      (identificado por su GID + shop) con un modelo 3D de la tabla "model",
--      más las medidas reales (cm) para escalar el modelo en AR.
--
-- Un producto Shopify tiene como mucho UN modelo asignado -> UNIQUE(shop, gid).
-- ============================================================

CREATE TABLE IF NOT EXISTS "shopify_product_model" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "shop"                text NOT NULL,
  "shopify_product_gid" text NOT NULL,
  "product_title"       text,
  "model_id"            uuid NOT NULL,
  "width_cm"            numeric,
  "height_cm"           numeric,
  "depth_cm"            numeric,
  "seller_id"           uuid,
  "created_at"          timestamp NOT NULL DEFAULT current_timestamp,
  "updated_at"          timestamp NOT NULL DEFAULT current_timestamp,
  UNIQUE ("shop", "shopify_product_gid")
);

ALTER TABLE "shopify_product_model"
  ADD CONSTRAINT "spm_model_fkey"
  FOREIGN KEY ("model_id") REFERENCES "model" ("id") ON DELETE CASCADE;

ALTER TABLE "shopify_product_model"
  ADD CONSTRAINT "spm_seller_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "customer" ("id") ON DELETE SET NULL;

ALTER TABLE "shopify_product_model" ENABLE ROW LEVEL SECURITY;

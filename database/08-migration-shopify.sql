-- ============================================================
-- Migración: SHOPIFY OAuth (tokens de acceso por tienda)
--
-- Correr en el SQL Editor de Supabase DESPUÉS de:
--   01-schema.sql ... 07-migration-ar-tool.sql
--
-- NOTA: si ya la corriste manualmente, NO la vuelvas a correr (usa IF NOT
-- EXISTS, así que es idempotente, pero igual no hace falta).
--
-- Cambios:
--   1. shopify_store -> tabla nueva: una fila por tienda Shopify instalada.
--      Guarda el access token offline obtenido vía OAuth, asociado al
--      vendedor (seller_id) que instaló la app.
-- ============================================================

CREATE TABLE IF NOT EXISTS "shopify_store" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "shop"         text UNIQUE NOT NULL,
  "access_token" text NOT NULL,
  "scope"        text,
  "seller_id"    uuid,
  "installed_at" timestamp NOT NULL DEFAULT current_timestamp,
  "updated_at"   timestamp NOT NULL DEFAULT current_timestamp
);

ALTER TABLE "shopify_store" ADD FOREIGN KEY ("seller_id") REFERENCES "user" ("id") ON DELETE SET NULL;

ALTER TABLE "shopify_store" ENABLE ROW LEVEL SECURITY;

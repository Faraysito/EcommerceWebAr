-- ============================================================
-- Migración: clientes (customer) + ventas (sale / sale_product)
-- Correr en el SQL Editor de Supabase DESPUÉS del schema.sql original.
--
-- Contexto: las tablas customer, sale y sale_product YA existen en el schema
-- original. Esta migración solo añade lo que faltaba para que funcionen los
-- clientes con email+contraseña y el checkout:
--   1. customer.name  (para saludar al cliente y mostrar en pedidos)
--   2. Índices para acelerar las consultas de pedidos por cliente.
--
-- NOTA RLS: igual que el resto del proyecto, el backend usa la service_role
-- key que bypasea RLS, así que basta con tener RLS habilitado (ya lo está en
-- el schema original). No se añaden políticas: ningún cliente toca la BD
-- directamente, todo pasa por el backend.
-- ============================================================

-- 1. Nombre del cliente (opcional). Si la columna ya existe, no falla.
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "name" text;

-- 2. Índices para las consultas más frecuentes.
--    - Buscar cliente por email (login / registro).
--    - Listar ventas de un cliente (historial de pedidos).
--    - Listar líneas de una venta.
CREATE INDEX IF NOT EXISTS "idx_customer_email" ON "customer" ("email");
CREATE INDEX IF NOT EXISTS "idx_sale_customer_id" ON "sale" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_sale_product_sale_id" ON "sale_product" ("sale_id");

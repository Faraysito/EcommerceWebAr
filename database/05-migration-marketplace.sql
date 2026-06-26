-- ============================================================
-- Migración: MARKETPLACE multivendedor (estilo Temu / AliExpress)
--
-- Convierte la tienda single-tenant (un solo local) en un marketplace donde
-- CUALQUIER cuenta puede comprar Y vender (auto-aprobado, sin revisión de
-- admin). Correr en el SQL Editor de Supabase DESPUÉS de:
--   01-schema.sql, 02-test-values.sql, 03-migration-sales.sql,
--   04-migration-sales-webpay.sql
--
-- Resumen de cambios:
--   1. customer  -> gana campos de vendedor (perfil de tienda + datos de pago)
--   2. product   -> gana seller_id (cada producto pertenece a un vendedor)
--   3. category  -> ahora es global y compartida (sin dueño); igual que antes
--   4. sale      -> sigue siendo la ORDEN del comprador (un carrito puede
--                   tener productos de varios vendedores)
--   5. sale_product -> gana seller_id + estado/payout por línea, porque cada
--                   vendedor cobra y despacha lo suyo por separado
--   6. payout    -> tabla nueva: liquidación de dinero por vendedor por orden
--   7. marketplace_setting -> comisión configurable del marketplace
--
-- NOTA RLS: igual que el resto del proyecto, el backend usa la service_role
-- key que bypasea RLS. Mantenemos RLS habilitado sin políticas: nadie toca la
-- BD directo, todo pasa por el backend.
-- ============================================================


-- ------------------------------------------------------------
-- 1. CUSTOMER como cuenta unificada (comprador + vendedor)
-- ------------------------------------------------------------
-- Toda cuenta nace como comprador. is_seller pasa a true en cuanto abre su
-- tienda (auto-aprobado). store_slug es el identificador público de la tienda
-- en la URL (/tienda/mi-slug). payout_* son los datos para liquidarle el
-- dinero de sus ventas (en Chile: banco + tipo de cuenta + RUT).

ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "is_seller"        boolean NOT NULL DEFAULT false;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "store_name"       text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "store_slug"       text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "store_bio"        text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "seller_since"     timestamp;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "payout_bank"      text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "payout_account_type" text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "payout_account_number" text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "payout_holder_name" text;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "payout_holder_doc"  text; -- RUT del titular

-- store_slug debe ser único entre tiendas (pero permite NULL para los que aún
-- no venden). Un índice único parcial logra justo eso.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_customer_store_slug"
  ON "customer" ("store_slug")
  WHERE "store_slug" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_customer_is_seller" ON "customer" ("is_seller");


-- ------------------------------------------------------------
-- 2. PRODUCT pertenece a un vendedor
-- ------------------------------------------------------------
-- seller_id apunta al customer dueño del producto. Es NULL temporalmente para
-- los productos que ya existían (del local original); más abajo se asignan a
-- un vendedor "seed" para no dejar huérfanos. Después lo dejamos NOT NULL.

ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "seller_id" uuid;

-- Asigna los productos existentes (si los hay) al primer customer marcado como
-- vendedor, o si no hay ninguno, deja la asignación para hacerse manualmente.
-- Esto evita romper el catálogo actual.
DO $$
DECLARE
  seed_seller uuid;
BEGIN
  SELECT "id" INTO seed_seller FROM "customer" WHERE "is_seller" = true LIMIT 1;
  IF seed_seller IS NOT NULL THEN
    UPDATE "product" SET "seller_id" = seed_seller WHERE "seller_id" IS NULL;
  END IF;
END $$;

-- FK e índice. Si quedaron productos sin seller (no había vendedores), la FK
-- igual se crea porque permite NULL; conviértela a NOT NULL una vez asignados.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_seller_id_fkey'
  ) THEN
    ALTER TABLE "product"
      ADD CONSTRAINT "product_seller_id_fkey"
      FOREIGN KEY ("seller_id") REFERENCES "customer" ("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_product_seller_id" ON "product" ("seller_id");


-- ------------------------------------------------------------
-- 3. SALE = orden del comprador
-- ------------------------------------------------------------
-- La columna customer_id ya existía y representa al COMPRADOR. Añadimos un
-- alias semántico vía vista no es necesario; solo documentamos: en marketplace
-- sale.customer_id = comprador. El detalle por vendedor va en sale_product.

-- (sin cambios estructurales en sale; el total sigue siendo el total de la
--  orden completa, suma de todas las líneas de todos los vendedores)


-- ------------------------------------------------------------
-- 4. SALE_PRODUCT: cada línea sabe de qué vendedor es
-- ------------------------------------------------------------
-- seller_id se copia desde product al momento de la compra (snapshot), para
-- que aunque el producto cambie de dueño o se borre, la línea conserve a quién
-- corresponde el cobro. commission_amount y seller_amount son el desglose:
--   sub_total = commission_amount + seller_amount
-- fulfillment_status: estado de despacho de ESTA línea (cada vendedor maneja
-- el suyo). El sale.status global queda como estado de pago de la orden.

CREATE TYPE "fulfillment_status" AS ENUM (
  'Pendiente',    -- pagado, esperando que el vendedor lo prepare
  'Preparando',   -- vendedor lo está alistando
  'Enviado',      -- despachado
  'Entregado',    -- recibido por el comprador
  'Cancelado'     -- cancelado/reembolsado
);

ALTER TABLE "sale_product" ADD COLUMN IF NOT EXISTS "seller_id" uuid;
ALTER TABLE "sale_product" ADD COLUMN IF NOT EXISTS "commission_amount" int NOT NULL DEFAULT 0;
ALTER TABLE "sale_product" ADD COLUMN IF NOT EXISTS "seller_amount" int NOT NULL DEFAULT 0;
ALTER TABLE "sale_product"
  ADD COLUMN IF NOT EXISTS "fulfillment_status" fulfillment_status NOT NULL DEFAULT 'Pendiente';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sale_product_seller_id_fkey'
  ) THEN
    ALTER TABLE "sale_product"
      ADD CONSTRAINT "sale_product_seller_id_fkey"
      FOREIGN KEY ("seller_id") REFERENCES "customer" ("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_sale_product_seller_id" ON "sale_product" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_sale_product_fulfillment" ON "sale_product" ("fulfillment_status");


-- ------------------------------------------------------------
-- 5. PAYOUT: liquidación de dinero a cada vendedor
-- ------------------------------------------------------------
-- Cuando una orden se paga, se genera (o acumula) lo que el marketplace le
-- debe a cada vendedor por esa orden. status controla el ciclo de pago al
-- vendedor (pendiente -> pagado). Es la "billetera" de cobros del vendedor.

CREATE TYPE "payout_status" AS ENUM ('Pendiente', 'Pagado', 'Retenido');

CREATE TABLE IF NOT EXISTS "payout" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL,
  "seller_id" uuid NOT NULL,
  "gross_amount" int NOT NULL,        -- suma de sub_total de las líneas del vendedor
  "commission_amount" int NOT NULL,   -- comisión que retiene el marketplace
  "net_amount" int NOT NULL,          -- lo que recibe el vendedor (gross - commission)
  "status" payout_status NOT NULL DEFAULT 'Pendiente',
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  UNIQUE ("sale_id", "seller_id")     -- un payout por vendedor por orden
);

ALTER TABLE "payout" ADD FOREIGN KEY ("sale_id") REFERENCES "sale" ("id");
ALTER TABLE "payout" ADD FOREIGN KEY ("seller_id") REFERENCES "customer" ("id");

CREATE INDEX IF NOT EXISTS "idx_payout_seller_id" ON "payout" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_payout_status" ON "payout" ("status");

ALTER TABLE "payout" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 6. MARKETPLACE_SETTING: configuración global (comisión, etc.)
-- ------------------------------------------------------------
-- Tabla clave-valor de una sola fila lógica para parámetros del marketplace.
-- commission_percent es la comisión que cobra la plataforma sobre cada venta
-- (ej. 10 = 10%). Editable por el admin.

CREATE TABLE IF NOT EXISTS "marketplace_setting" (
  "id" int PRIMARY KEY DEFAULT 1,
  "commission_percent" int NOT NULL DEFAULT 10,
  "currency" text NOT NULL DEFAULT 'CLP',
  "updated_at" timestamp NOT NULL DEFAULT current_timestamp,
  CONSTRAINT "single_row" CHECK ("id" = 1)
);

INSERT INTO "marketplace_setting" ("id", "commission_percent")
VALUES (1, 10)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "marketplace_setting" ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 7. Permisos nuevos para el panel admin del marketplace
-- ------------------------------------------------------------
INSERT INTO "permission" ("name") VALUES
  ('seller.read'), ('seller.update'), ('seller.delete'),
  ('payout.read'), ('payout.update'),
  ('marketplace.read'), ('marketplace.update')
ON CONFLICT ("name") DO NOTHING;

-- Asigna los permisos nuevos al rol admin (superadmin igual los bypasea, pero
-- así quedan correctos para roles no-superadmin).
INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "role" r
CROSS JOIN "permission" p
WHERE r."name" = 'admin'
  AND p."name" IN (
    'seller.read','seller.update','seller.delete',
    'payout.read','payout.update',
    'marketplace.read','marketplace.update'
  )
ON CONFLICT DO NOTHING;

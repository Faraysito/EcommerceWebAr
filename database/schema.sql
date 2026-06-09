CREATE TYPE "sale_status" AS ENUM (
  'Pendiente',
  'En progreso',
  'Completado'
);

CREATE TYPE "offer_type" AS ENUM (
  'PERCENTAGE',
  'FIXED'
);

CREATE TABLE "permission" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "role" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "password" text NOT NULL,
  "role_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "role_permission" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "category" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "image" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "file_key" text UNIQUE NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "model" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "file_key" text UNIQUE NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "product" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "category_id" uuid NOT NULL,
  "model_id" uuid,
  "price" int NOT NULL,
  "stock" int NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "product_image" (
  "product_id" uuid NOT NULL,
  "image_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("image_id", "product_id")
);

CREATE TABLE "sale" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" sale_status NOT NULL DEFAULT 'Pendiente',
  "customer_id" uuid NOT NULL,
  "total" int NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "sale_product" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "sale_id" uuid NOT NULL,
  "quantity" int NOT NULL,
  "unit_price" int NOT NULL,
  "sub_total" int NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "offer" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "discount_type" offer_type NOT NULL,
  "discount_value" int NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "customer" (
  "id" uuid DEFAULT gen_random_uuid(),
  "email" text UNIQUE,
  "password" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX ON "sale_product" ("product_id", "sale_id");

COMMENT ON COLUMN "product"."price" IS 'Debe ser mayor a 0';

COMMENT ON COLUMN "product"."stock" IS 'Debe ser mayor a 0';

COMMENT ON COLUMN "sale"."total" IS 'Debe ser mayor a 0';

COMMENT ON COLUMN "sale_product"."quantity" IS 'Debe ser mayor a 0';

COMMENT ON COLUMN "offer"."discount_value" IS 'Debe ser mayor a 0';

COMMENT ON COLUMN "offer"."end_date" IS 'Debe ser despues de start_date';

ALTER TABLE "user" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permission" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permission" ADD FOREIGN KEY ("permission_id") REFERENCES "permission" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product" ADD FOREIGN KEY ("category_id") REFERENCES "category" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product" ADD FOREIGN KEY ("model_id") REFERENCES "model" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_image" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_image" ADD FOREIGN KEY ("image_id") REFERENCES "image" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sale" ADD FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sale_product" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sale_product" ADD FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "offer" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE TYPE "payment_method" AS ENUM ('Webpay Plus', 'cash');

ALTER TYPE "sale_status" ADD VALUE 'Cancelado';

ALTER TABLE public."sale"
ADD COLUMN "transaction_token" text,
ADD COLUMN "buy_order" text,
ADD COLUMN "authorization_code" text,
ADD COLUMN "card_number" text,
ADD COLUMN "payment_method" payment_method not null,
ADD COLUMN "payment_status" text;
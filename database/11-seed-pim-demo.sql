-- ============================================================
-- Seed de DEMO para el PIM (datos ficticios)
--
-- Correr DESPUÉS de 10-migration-pim.sql. Idempotente (ON CONFLICT DO NOTHING).
-- Crea: 2 familias con atributos, categorías jerárquicas, 2 canales, ~18
-- productos de 3 importadores distintos con estados y completitud variados
-- (algunos con atributos obligatorios faltantes, para lucir el % de completitud).
--
-- Los productos quedan con seller_id NULL (permitido): en el PIM el origen es
-- el importador (columna supplier), no un vendedor del marketplace.
-- ============================================================

-- ---------- CATEGORÍAS (jerárquicas) ----------
INSERT INTO "category" ("id","name","parent_id") VALUES
  ('c0000000-0000-4000-8000-000000000001','Tecnología', NULL)
ON CONFLICT ("name") DO NOTHING;
INSERT INTO "category" ("id","name","parent_id") VALUES
  ('c0000000-0000-4000-8000-000000000002','Audio y Sonido','c0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003','Electrohogar','c0000000-0000-4000-8000-000000000001')
ON CONFLICT ("name") DO NOTHING;
INSERT INTO "category" ("id","name","parent_id") VALUES
  ('c0000000-0000-4000-8000-000000000004','Vestuario y Moda', NULL)
ON CONFLICT ("name") DO NOTHING;
INSERT INTO "category" ("id","name","parent_id") VALUES
  ('c0000000-0000-4000-8000-000000000005','Poleras y Polerones','c0000000-0000-4000-8000-000000000004')
ON CONFLICT ("name") DO NOTHING;

-- ---------- FAMILIAS ----------
INSERT INTO "pim_family" ("id","code","name") VALUES
  ('f0000000-0000-4000-8000-000000000001','electronica','Electrónica'),
  ('f0000000-0000-4000-8000-000000000002','vestuario','Vestuario')
ON CONFLICT ("code") DO NOTHING;

-- ---------- ATRIBUTOS: Electrónica ----------
INSERT INTO "pim_attribute" ("family_id","code","label","type","required","unit","options","position") VALUES
  ('f0000000-0000-4000-8000-000000000001','voltaje','Voltaje','select',true, NULL, '["110V","220V","Dual"]'::jsonb,1),
  ('f0000000-0000-4000-8000-000000000001','potencia_w','Potencia','number',true,'W','[]'::jsonb,2),
  ('f0000000-0000-4000-8000-000000000001','color','Color','text',false,NULL,'[]'::jsonb,3),
  ('f0000000-0000-4000-8000-000000000001','garantia_meses','Garantía','number',true,'meses','[]'::jsonb,4)
ON CONFLICT ("family_id","code") DO NOTHING;

-- ---------- ATRIBUTOS: Vestuario ----------
INSERT INTO "pim_attribute" ("family_id","code","label","type","required","unit","options","position") VALUES
  ('f0000000-0000-4000-8000-000000000002','talla','Talla','select',true,NULL,'["XS","S","M","L","XL"]'::jsonb,1),
  ('f0000000-0000-4000-8000-000000000002','material','Material','text',true,NULL,'[]'::jsonb,2),
  ('f0000000-0000-4000-8000-000000000002','color','Color','select',false,NULL,'["Negro","Blanco","Azul","Rojo","Gris"]'::jsonb,3),
  ('f0000000-0000-4000-8000-000000000002','genero','Género','select',true,NULL,'["Hombre","Mujer","Unisex"]'::jsonb,4)
ON CONFLICT ("family_id","code") DO NOTHING;

-- ---------- CANALES ----------
INSERT INTO "pim_channel" ("id","code","name","kind","config") VALUES
  ('e0000000-0000-4000-8000-000000000001','correos-shopify','Marketplace Correos (Shopify Plus)','shopify','{"note":"Conecta con el conector Shopify existente"}'::jsonb),
  ('e0000000-0000-4000-8000-000000000002','feed-generico','Feed genérico (CSV / API)','generic','{}'::jsonb)
ON CONFLICT ("code") DO NOTHING;

-- ---------- PRODUCTOS (Electrónica) ----------
INSERT INTO "product" ("id","name","description","category_id","family_id","price","stock","sku","ean","brand","supplier","pim_status","attributes") VALUES
  ('a0000000-0000-4000-8000-000000000001','Audífonos Bluetooth ProBass X200','Over-ear con cancelación de ruido activa.','c0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',39990,120,'ELEC-AUD-X200','7801234500011','ProBass','Importadora Andina','published','{"voltaje":"Dual","potencia_w":30,"color":"Negro","garantia_meses":12}'::jsonb),
  ('a0000000-0000-4000-8000-000000000002','Parlante Portátil BoomGo Mini','Resistente al agua IPX7, 12h de batería.','c0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',24990,80,'ELEC-AUD-BGMINI','7801234500028','BoomGo','Importadora Andina','published','{"voltaje":"Dual","potencia_w":15,"color":"Azul","garantia_meses":6}'::jsonb),
  ('a0000000-0000-4000-8000-000000000003','Soundbar HomeCinema SB-500','Barra de sonido 2.1 con subwoofer inalámbrico.','c0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',89990,25,'ELEC-AUD-SB500','7801234500035','HomeCinema','TecnoImport SpA','approved','{"voltaje":"220V","potencia_w":120,"garantia_meses":24}'::jsonb),
  ('a0000000-0000-4000-8000-000000000004','Hervidor Eléctrico KitchenPro 1.7L','Acero inoxidable, apagado automático.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',19990,200,'ELEC-EH-KP17','7801234500042','KitchenPro','Comercial del Pacífico','review','{"voltaje":"220V","potencia_w":2000}'::jsonb),
  ('a0000000-0000-4000-8000-000000000005','Aspiradora Robot CleanBot R9','Mapeo láser, control por app.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',149990,15,'ELEC-EH-CBR9','7801234500059','CleanBot','TecnoImport SpA','draft','{"voltaje":"Dual"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000006','Freidora de Aire AirCrisp 5L','Sin aceite, panel digital 8 programas.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',54990,60,'ELEC-EH-AC5','7801234500066','AirCrisp','Comercial del Pacífico','published','{"voltaje":"220V","potencia_w":1500,"color":"Negro","garantia_meses":12}'::jsonb),
  ('a0000000-0000-4000-8000-000000000007','Microondas SmartWave 25L','Grill integrado, descongelado rápido.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',69990,40,'ELEC-EH-SW25','7801234500073','SmartWave','Importadora Andina','approved','{"voltaje":"220V","potencia_w":900,"color":"Plata","garantia_meses":18}'::jsonb),
  ('a0000000-0000-4000-8000-000000000008','Audífonos In-Ear SportFit','Deportivos, sudor-resistentes.','c0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',14990,300,'ELEC-AUD-SF','7801234500080','SportFit','TecnoImport SpA','draft','{"potencia_w":10}'::jsonb),
  ('a0000000-0000-4000-8000-000000000009','Batidora de Pedestal MixMaster','Bowl 4.5L, 6 velocidades.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',44990,35,'ELEC-EH-MM','7801234500097','MixMaster','Comercial del Pacífico','review','{"voltaje":"220V","potencia_w":600,"color":"Rojo"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000010','Cafetera Espresso BaristaOne','Presión 15 bar, espumador de leche.','c0000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',119990,20,'ELEC-EH-B1','7801234500103','BaristaOne','Importadora Andina','published','{"voltaje":"220V","potencia_w":1350,"color":"Acero","garantia_meses":24}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- ---------- PRODUCTOS (Vestuario) ----------
INSERT INTO "product" ("id","name","description","category_id","family_id","price","stock","sku","ean","brand","supplier","pim_status","attributes") VALUES
  ('a0000000-0000-4000-8000-000000000011','Polera Algodón Orgánico Basic','Corte regular, cuello redondo.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',12990,500,'VEST-POL-BASIC','7801234500110','UrbanWear','Comercial del Pacífico','published','{"talla":"M","material":"Algodón orgánico","color":"Blanco","genero":"Unisex"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000012','Polerón con Capucha StreetHood','Felpa perchada interior, bolsillo canguro.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',24990,250,'VEST-POL-HOOD','7801234500127','StreetHood','Importadora Andina','approved','{"talla":"L","material":"Algodón/Poliéster","genero":"Hombre"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000013','Polera Deportiva DryFlex','Tela técnica de secado rápido.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',15990,180,'VEST-POL-DRY','7801234500134','DryFlex','TecnoImport SpA','review','{"talla":"S","material":"Poliéster","color":"Azul"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000014','Polerón Oversize CozyFit','Corte holgado unisex.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',27990,90,'VEST-POL-COZY','7801234500141','CozyFit','Comercial del Pacífico','draft','{"talla":"XL"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000015','Polera Estampada ArtInk','Estampado serigrafía a 3 colores.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',13990,320,'VEST-POL-ART','7801234500158','ArtInk','Importadora Andina','published','{"talla":"M","material":"Algodón","color":"Negro","genero":"Unisex"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000016','Polera Manga Larga ThermalBase','Térmica primera capa.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',18990,140,'VEST-POL-THERM','7801234500165','ThermalBase','TecnoImport SpA','approved','{"talla":"L","material":"Algodón/Elastano","color":"Gris","genero":"Mujer"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000017','Polerón Cierre Full FlexZip','Cierre completo, puños elásticos.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',29990,70,'VEST-POL-ZIP','7801234500172','FlexZip','Comercial del Pacífico','draft','{"material":"Algodón"}'::jsonb),
  ('a0000000-0000-4000-8000-000000000018','Polera Cuello V EssentialV','Básica cuello en V.','c0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000002',11990,410,'VEST-POL-V','7801234500189','EssentialV','Importadora Andina','published','{"talla":"S","material":"Algodón","color":"Blanco","genero":"Mujer"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- ---------- VARIANTES (ejemplo) ----------
INSERT INTO "product_variant" ("product_id","sku","ean","name","price","stock","attributes","position") VALUES
  ('a0000000-0000-4000-8000-000000000011','VEST-POL-BASIC-S-BL','7801234500110','Talla S / Blanco',12990,120,'{"talla":"S","color":"Blanco"}'::jsonb,1),
  ('a0000000-0000-4000-8000-000000000011','VEST-POL-BASIC-M-BL','7801234500110','Talla M / Blanco',12990,200,'{"talla":"M","color":"Blanco"}'::jsonb,2),
  ('a0000000-0000-4000-8000-000000000011','VEST-POL-BASIC-L-NE','7801234500110','Talla L / Negro',12990,180,'{"talla":"L","color":"Negro"}'::jsonb,3),
  ('a0000000-0000-4000-8000-000000000001','ELEC-AUD-X200-NE','7801234500011','Negro',39990,80,'{"color":"Negro"}'::jsonb,1),
  ('a0000000-0000-4000-8000-000000000001','ELEC-AUD-X200-BL','7801234500011','Blanco',39990,40,'{"color":"Blanco"}'::jsonb,2)
ON CONFLICT DO NOTHING;

-- ---------- ESTADO EN CANALES (ejemplo) ----------
-- Publicados en el canal Correos/Shopify.
INSERT INTO "product_channel" ("product_id","channel_id","status","published_at") VALUES
  ('a0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','published',current_timestamp),
  ('a0000000-0000-4000-8000-000000000006','e0000000-0000-4000-8000-000000000001','published',current_timestamp),
  ('a0000000-0000-4000-8000-000000000011','e0000000-0000-4000-8000-000000000001','published',current_timestamp),
  ('a0000000-0000-4000-8000-000000000010','e0000000-0000-4000-8000-000000000001','ready',NULL),
  ('a0000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000001','pending',NULL)
ON CONFLICT DO NOTHING;

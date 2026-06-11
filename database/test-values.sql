INSERT INTO "role" ("name") VALUES ('admin');

INSERT INTO "permission" ("name") VALUES
('user.read'),('user.create'),('user.update'),('user.delete'),
('role.read'),('role.create'),('role.update'),('role.delete'),
('permission.read'),('permission.create'),('permission.update'),('permission.delete'),
('category.read'),('category.create'),('category.update'),('category.delete'),
('product.read'),('product.create'),('product.update'),('product.delete'),
('image.read'),('image.create'),('image.update'),('image.delete'),
('model.read'),('model.create'),('model.update'),('model.delete'),
('offer.read'),('offer.create'),('offer.update'),('offer.delete'),
('customer.read'),('customer.create'),('customer.update'),('customer.delete'),
('sale.read'),('sale.create'),('sale.update'),('sale.delete');

INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "role" r
CROSS JOIN "permission" p
WHERE r."name" = 'admin';
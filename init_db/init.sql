\c ozon_prices

CREATE TABLE prices (
  id BIGSERIAL PRIMARY KEY,
  product_id bigint,
  price INT,
  date_check timestamp
);
ALTER TABLE prices
ALTER COLUMN date_check SET DEFAULT NOW();

CREATE TYPE reason_enum AS ENUM ('not_exist', 'out_of_stock', 'not_delivery', 'different');
CREATE TABLE not_existed_products (
  id BIGSERIAL PRIMARY KEY,
  product_id bigint,
  reason reason_enum,
  last_date_check timestamp
);
ALTER TABLE not_existed_products
ALTER COLUMN last_date_check SET DEFAULT NOW();

CREATE TYPE border_enum AS ENUM ('left', 'right');
CREATE TABLE borders (
  id BIGSERIAL PRIMARY KEY,
  left_id bigint,
  right_id bigint
);

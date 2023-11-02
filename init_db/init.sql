\c ozon_prices

CREATE TABLE prices (
  id BIGSERIAL PRIMARY KEY,
  product_id bigint,
  price INT,
  date_check timestamp
);

ALTER TABLE prices
ALTER COLUMN date_check SET DEFAULT NOW();

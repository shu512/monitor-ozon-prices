const { Client } = require('pg');

const DEFULAT_PG_PORT = 5432;

const clientOptions = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || DEFULAT_PG_PORT,
};

/**
 * prepare data to insert to db
 * @param { { price: number, productId: number }[] } priceInfos 
 * @returns {[
*    string,
*    number[]   
* ]}
* returns tuple of 2 elements.
* - The first elem is string, e.g. ...VALUES ($1::int, $2::int),($3::int, $4::int),($5::int, $6::int),($7::int, $8::int)
* - The second one is array of numbers to insert to db
*/
function getQueryPrices(priceInfos) {
  const args = priceInfos.reduce((arr, cur) => [...arr, cur.productId, cur.price], []);
  let queryArgs = priceInfos.reduce(
    (query, _cur, index) => query + `($${index * 2 + 1}::int, $${index * 2 + 2}::int),`,
    ''
  );
  queryArgs = queryArgs.slice(0, queryArgs.length - 1);
  const query = `INSERT INTO prices (product_id, price) VALUES ${queryArgs};`;
  return [query, args];
}

/**
* 
* @async
* @param { { price: number, productId: number }[] } priceInfos 
*/
async function loadToDbPrices(priceInfos) {
  if (priceInfos.length === 0) return;
  console.log('loadToDb:', priceInfos.length);

  const client = new Client(clientOptions);
  await client.connect();

  const [query, args] = getQueryPrices(priceInfos);
  
  await client.query(query, args)
  await client.end()
}

/**
 * prepare data to insert to db
 * @param { { reason: string, productId: number }[] } products 
 * @returns {[
*    string,
*    [number | string]   
* ]}
* returns tuple of 2 elements.
* - The first elem is string, e.g. ...VALUES($1::int, $2::reason_enum),($3::int, $4::reason_enum),($5::int, $6::reason_enum),($7::int, $8::reason_enum)
* - The second one is array of values to insert to db
*/
function getQueryNotExistedProducts(products) {
  const args = products.reduce((arr, cur) => [...arr, cur.productId, cur.reason], []);
  let queryArgs = products.reduce(
    (query, _cur, index) => query + `($${index * 2 + 1}::int, $${index * 2 + 2}::reason_enum),`,
    ''
  );
  queryArgs = queryArgs.slice(0, queryArgs.length - 1);
  const query = `INSERT INTO not_existed_products (product_id, reason) VALUES ${queryArgs};`;
  return [query, args];
}

/**
* 
* @async
* @param { { reason: string, productId: number }[] } products 
*/
async function loadToDbNotExistedProducts(products) {
  if (products.length === 0) return;
  console.log('loadToDbNotExistedProducts', products.length);

  const client = new Client(clientOptions);
  await client.connect();

  const [query, args] = getQueryNotExistedProducts(products);

  await client.query(query, args)
  await client.end()
}

/**
 * Returns products that are not in the range of given IDs
 * 
 * @async
 * @param {number} from
 * @param {number} to
 * @returns {Promise(number[])}
 */
async function getNotExistedProducts(from, to) {
  const client = new Client(clientOptions);
  await client.connect();
  const res = await client.query(`SELECT product_id FROM not_existed_products WHERE product_id >= ${from} AND product_id <= ${to};`, [])
  await client.end();
  return res.rows.map(obj => Number(obj.product_id));
}

module.exports = {
  loadToDbPrices,
  loadToDbNotExistedProducts,
  getNotExistedProducts,
}

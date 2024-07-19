const { Client } = require('pg');

const clientOptions = {
  database: 'ozon_prices',
  user: 'shu512',
  host: 'localhost',
  password: 'shu512',
  port: 5432
};

/**
 * prepare data to insert to db
 * @param { { price: number, productId: number }[] } priceInfos 
 * @returns {[
*    string,
*    number[]   
* ]}
* returns tuple of 2 elements.
* - The first elem is string, e.g. ($1::int, $2::int),($3::int, $4::int),($5::int, $6::int),($7::int, $8::int)
* - The second one is array of numbers to insert to db
*/
function getQuery(priceInfos) {
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
async function loadToDb(priceInfos) {
  if (priceInfos.length === 0) return;
  console.log('loadToDb:', priceInfos);

  const client = new Client(clientOptions);
  await client.connect();

  const [query, args] = getQuery(priceInfos);
  
  await client.query(query, args)
  await client.end()
}

async function showDbContent() {
  const client = new Client(clientOptions);
  await client.connect();
  // await client.query('DELETE FROM prices;', [])
  const res = await client.query('SELECT product_id, price FROM prices;', [])
  // console.log(res.rows)
  await client.end();
}

module.exports = {
  loadToDb,
  showDbContent,
}
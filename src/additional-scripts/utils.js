const { executeQuery } = require('../utils/db');

async function updateLeftBorder(border) {
  console.log(`Updating left border to ${border}`);
  const query = 'INSERT INTO borders (left_id, right_id) VALUES ($1::int, -1);';
  const args = [border];
  await executeQuery(query, args);
}

async function updateRightBorder(border) {
  console.log(`Updating right border to ${border}`);
  const query = 'UPDATE borders SET right_id = $1::int WHERE right_id = -1;';
  const args = [border];
  await executeQuery(query, args);
}

module.exports = {
  updateLeftBorder,
  updateRightBorder,
};

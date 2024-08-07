const { checkPrices } = require('./checkPrices');
const { getActualIds, splitArray } = require('./utils');
const { getNotExistedProducts } = require('./utils/db');
const { logStartSeach, logFinishSearch } = require('./utils/log');

/**
 * @param {{ from: number, to: number, threads: number}} searchParams
 * 
 */ 
async function runSearch(searchParams) {
  const startDate = logStartSeach(searchParams);
  const idsToSkip = await getNotExistedProducts(searchParams.from, searchParams.to);
  const ids = splitArray(getActualIds(searchParams, idsToSkip), searchParams.threads);
  await Promise.all(
    ids.map(idsChuck => checkPrices(idsChuck))
  );

  logFinishSearch(searchParams, startDate);
}

module.exports = {
  runSearch,
}

require('dotenv').config()

const { runSearch } = require('./runSearch');
const { getBorders } = require('./utils/db');
const { logStart, logFinish } = require('./utils/log');
const { validateEnv } = require('./utils/validate_env');

const DEFAULT_THREADS = 1;
const DEFAULT_STEP = 50000;

async function main() {
  validateEnv();

  const { minId, maxId } = await getBorders()
  
  const threads = Number(process.env.THREADS_AMOUNT) || DEFAULT_THREADS;
  const step = Number(process.env.STEP) || DEFAULT_STEP;

  let left = Number(process.env.START_FROM) || minId;
  let right = left + step;

  const startDate = logStart(minId, maxId);
  while(left < maxId) {
    if (right > maxId) right = maxId;

    await runSearch({
      from: left,
      to: right,
      threads,
    });

    left = right + 1;
    right = left + step;
  }

  logFinish(minId, maxId, startDate);
}

main();

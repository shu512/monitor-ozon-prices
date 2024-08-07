require('dotenv').config()

const { runSearch } = require('./runSearch');
const { getBorders } = require('./utils/db');
const { logStart, logFinish } = require('./utils/log');
const { validateEnv } = require('./utils/validate_env');

const DEFAULT_THREADS = 1;
const DEFAULT_STEP = 50000;

async function main() {
  validateEnv();

  const { leftBorder, rightBorder } = await getBorders()
  
  const threads = Number(process.env.THREADS_AMOUNT) || DEFAULT_THREADS;
  const step = Number(process.env.STEP) || DEFAULT_STEP;

  let left = Number(process.env.START_FROM) || leftBorder;
  let right = left + step;

  const startDate = logStart(leftBorder, rightBorder);
  while(left < rightBorder) {
    if (right > rightBorder) right = rightBorder;

    await runSearch({
      from: left,
      to: right,
      threads,
    });

    left = right + 1;
    right = left + step;
  }

  logFinish(leftBorder, rightBorder, startDate);
}

main();

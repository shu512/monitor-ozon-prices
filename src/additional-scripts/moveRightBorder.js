require('dotenv').config()

const { updateRightBorder } = require('./utils');
const { executeQuery } = require('../utils/db');
const { validateEnv } = require('../utils/validate_env');
const { getDriver } = require('../utils/driver');

const { processPageElement } = require('../checkPrices');

const DEFAULT_TRESHOLD = 10000;
const DEFAULT_MAX_ID = 1558059265;

async function moveRightBorder() {
  validateEnv();

  let maxId;
  try {
    const borders = await getRightBorder();
    maxId = borders.maxId;
  } catch (err) {
    console.log(`[ERROR]: Unable to get borders: ` + err);
    return
  }
  const driver = await getDriver();

  const treshold = DEFAULT_TRESHOLD;
  const id = await goLeft(driver, maxId, treshold);
  if (maxId - id >= treshold) {
    await updateRightBorder(id - treshold);
  } else {
    const newMaxId = await goRight(driver, maxId, treshold, maxId - id);
    await updateRightBorder(newMaxId);
  }

  await driver.quit();
}

async function getRightBorder() {
  const res = await executeQuery(`SELECT left_id, right_id FROM borders ORDER BY id DESC LIMIT 2`, []);
  if (res.rowCount < 2) throw Error('[Error] Borders table should have at least 2 rows');
  
  const maxId = res.rows[0].right_id === -1 ? res.rows[1].right_id : res.rows[0].right_id;

  return { minId: Number(res.rows[0].left_id), maxId: Number(maxId) };
}

async function goRight(driver, id, maxTreshold, curTreshold) {
  let curId = id;
  let productExist;

  while (curTreshold < maxTreshold) {
    productExist = await findProduct(driver, curId);
    if (productExist) {
      curTreshold = 0;
    } else {
      curTreshold++;
    }
    curId++;
    if (curId % STEP_TO_LOG === 0) {
      console.log(`[goRight] Current id: ${curId}`);
    }
  }

  console.log(`[goRight] Found product with id ${curId}`);
  return curId;
}

async function goLeft(driver, maxId) {
  let curId = maxId + 1;
  let productExist;

  do {
    curId--;
    if (curId % STEP_TO_LOG === 0) {
      console.log(`[goLeft] Current id: ${curId}`);
    }
    productExist = await findProduct(driver, curId);
  } while(!productExist)

  console.log(`[goLeft] Found product with id ${curId}`);
  return curId;
}

async function findProduct(driver, id) {
  try {
    priceInfo = await processPageElement(driver, id);

    if (priceInfo?.price) return true;
    return false;
  }
  catch (err) {
    console.log(`[ERROR]: Unable to process product with id ${id}: ` + err);
  }
}

moveRightBorder();
require('dotenv').config()

const { updateLeftBorder } = require('./utils');
const { getBorders } = require('../utils/db');
const { validateEnv } = require('../utils/validate_env');
const { getDriver } = require('../utils/driver');

const { processPageElement } = require('../checkPrices');

const DEFAULT_TRESHOLD = 10000;
const DEFAULT_MIN_ID = 10000;
const STEP_TO_LOG = 10000;

async function moveLeftBorder() {
  validateEnv();

  let minId;
  try {
    const borders = await getBorders();
    minId = borders.minId;
  } catch (err) {
    console.log(`[ERROR]: Unable to get borders. Using ${DEFAULT_MIN_ID} as DEFAULT_MIN_ID. Error: ` + err);
    minId = DEFAULT_MIN_ID;
  }
  const driver = await getDriver();

  const treshold = DEFAULT_TRESHOLD;
  const id = await goRight(driver, minId, treshold);
  if (id - minId >= treshold) {
    await updateLeftBorder(id - treshold);
  } else {
    const newMinId = await goLeft(driver, minId, treshold, id - minId);
    await updateLeftBorder(newMinId);
  }

  await driver.quit();
}

async function goLeft(driver, id, maxTreshold, curTreshold) {
  let curId = id;
  let productExist;

  while (curTreshold < maxTreshold) {
    productExist = await findProduct(driver, curId);
    if (productExist) {
      curTreshold = 0;
    } else {
      curTreshold++;
    }
    curId--;
    if (curId % STEP_TO_LOG === 0) {
      console.log(`[goLeft] Current id: ${curId}`);
    }
  }

  console.log(`[goLeft] Found product with id ${curId}`);
  return curId;
}

async function goRight(driver, minId) {
  let curId = minId - 1;
  let productExist;

  do {
    curId++;
    if (curId % STEP_TO_LOG === 0) {
      console.log(`[goRight] Current id: ${curId}`);
    }
    productExist = await findProduct(driver, curId);
  } while(!productExist)

  console.log(`[goRight] Found product with id ${curId}`);
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

moveLeftBorder();
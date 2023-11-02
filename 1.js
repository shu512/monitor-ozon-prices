const { Builder, Browser, By, ThenableWebDriver, WebElement } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Client } = require('pg');
const fs = require('fs');
const { DateTime, Duration } = require('luxon');

const LIMIT_TRIES = 20;
const LIMIT_BATCH = 10000;

const priceXpath = "//div[@data-widget='webPrice']/descendant::span[contains(text(),'₽')]";
const outOfStockXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'Этот товар закончился')]";
const notDeliveryXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'не доставляется')]";
const notExistXpath = "//div[@data-widget='error']";
const plus18Xpath = "//span[contains(text(), 'Подтвердите возраст')]";

const cloudfareId = 'challenge-running';

const clientOptions = {
  database: 'ozon_prices',
  user: 'shu512',
  host: 'localhost',
  password: 'shu512',
  port: 5432
};

/**
 * @param {string} priceText - e.g. "1 309 ₽"
 * @returns {number} - e.g. 1309
 */
function getPriceFromText(priceText) {
  const text = priceText.replace("₽", "").replace(/ /g, "");
  return parseFloat(text);
}

/**
 * @async
 * returns function that awaits until the text (price; out of stock; cannot be delivered; not exist) appears
 * @param {ThenableWebDriver} driver 
 * @returns {() => Promise<WebElement>}
 */
function awaitPrice(driver) {
  return async () => {
    let elem;
    let i = 0;
    while(true) {
      elem = await driver.findElements(By.xpath(priceXpath));
      if (elem.length > 0) return elem[0];
  
      elem = await driver.findElements(By.xpath(outOfStockXpath));
      if (elem.length > 0) return elem[0];

      elem = await driver.findElements(By.xpath(notDeliveryXpath));
      if (elem.length > 0) return elem[0];

      elem = await driver.findElements(By.xpath(notExistXpath));
      if (elem.length > 0) return elem[0];

      elem = await driver.findElements(By.id(cloudfareId));
      if (elem.length > 0) {
        console.log('cloudfare');
        return elem[0];
      }

      elem = await driver.findElements(By.xpath(plus18Xpath));
      if (elem.length > 0) {
        await driver.manage().addCookie({ name: 'is_adult_confirmed', value: 'true' });
        await driver.manage().addCookie({ name: 'adult_user_birthdate', value: '2001-11-11' });
        await driver.navigate().refresh();
      }
  
      i++;
      if (i >= LIMIT_TRIES) {
        return true;
      }
      await driver.sleep(100);
    }
  };
}

/**
 * @async
 * @param {ThenableWebDriver} driver 
 * @param {number} id 
 * @returns { Promise<{ price: number, productId: number } | null> }
 */
async function getPriceInfoFromPage(driver, id) {
  let text;
  await driver.get(`https://www.ozon.ru/product/${id}`);
  try {
    text = await driver.wait(
      awaitPrice(driver),
      2000
    ).then(elem => elem.getText());
  } catch {}
  if (text?.includes('₽')) {
    const price = getPriceFromText(text);
    return {
      price,
      productId: id,
    };
  }
  return null;
}

/**
 * @async
 * @param {ThenableWebDriver} driver 
 * @param {number} id 
 * @returns { Promise<{ price: number, productId: number } | null> }
 */
async function runSearch(idFrom, idTo) {
  
  // const options = new chrome.Options().addArguments('--headless=new');
  const options = new chrome.Options();

  let priceInfos = [];
  let driver;
  let priceInfo;

  for(let id = idTo; id >= idFrom; id--) {
    driver = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();


    try {
      priceInfo = await getPriceInfoFromPage(driver, id);
      if (priceInfo) priceInfos.push(priceInfo);

      if (priceInfos.length >= LIMIT_BATCH) {
        await loadToDb(priceInfos);
        priceInfos = [];
      }
    } finally {
      await driver.quit();
    }
  }

  await loadToDb(priceInfos);
  priceInfos = [];
}

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
    (query, cur, index) => query + `($${index * 2 + 1}::int, $${index * 2 + 2}::int),`,
    ''
  );
  queryArgs = queryArgs.slice(0, queryArgs.length - 1);
  const query = `insert into prices (product_id, price) values ${queryArgs};`;
  return [query, args];
}

/**
 * 
 * @async
 * @param { { price: number, productId: number }[] } priceInfos 
 */
async function loadToDb(priceInfos) {
  if (priceInfos.length === 0) return;

  const client = new Client(clientOptions);
  await client.connect();

  const [query, args] = getQuery(priceInfos);
  
  await client.query(query, args)
  await client.end()
}

function calculateSearcherOptions({ from, to ,threads }) {
  const step = Math.ceil((to - from) / threads);
  const input = Array.from({ length: threads }).map((_, index) => ({
    from: step * index + from,
    to: step * (index + 1) + from - 1
  }));

  input[input.length - 1].to = to;
  return input;
}

function logStarted({ from, to ,threads }) {
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  fs.appendFileSync(
    'ozon_prices.log',
    `[${dateHumanized}]: Start scanning.  From: ${from}; to: ${to}; threads: ${threads}\n`
  );
}

function logFinished({ from, to ,threads }, startDate) {
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const duration = date.diff(startDate).seconds;
  fs.appendFileSync(
    'ozon_prices.log',
    `[${dateHumanized}]: Finish scanning. From: ${from}; to: ${to}; threads: ${threads}. Duration: ${duration.toHuman()}\n`
  );
}

(async function main() {
  const input = {
    from    : 806075000,
    to      : 806076859,
    threads : 10,
  };

  // const input = {
  //   from    : 806070000,
  //   to      : 806070000,
  //   threads : 1,
  // };
  
  const searcherOptions = calculateSearcherOptions(input);
  const startDate = logStarted(input);

  const searchers = searcherOptions.map(params => runSearch(params.from, params.to));
  await Promise.all(searchers);

  logFinished(input, startDate);

  const client = new Client(clientOptions);
  await client.connect();
  // await client.query('DELETE FROM prices;', [])
  const res = await client.query('SELECT product_id, price from prices;', [])
  console.log(res.rows)
  await client.end();
})();

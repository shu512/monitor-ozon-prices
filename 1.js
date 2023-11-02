const {Builder, Browser, By, ThenableWebDriver, WebElement} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Client } = require('pg');

const LIMIT_TRIES = 20;

const priceXpath = "//div[@data-widget='webPrice']/descendant::span[contains(text(),'₽')]";
const outOfStockXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'Этот товар закончился')]";
const notDeliveryXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'не доставляется')]";
const notExistXpath = "//div[@data-widget='error']";

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
      elem = await driver.findElements(By.xpath(priceXpath))
      if (elem.length > 0) return elem[0];
  
      elem = await driver.findElements(By.xpath(outOfStockXpath))
      if (elem.length > 0) return elem[0];

      elem = await driver.findElements(By.xpath(notDeliveryXpath))
      if (elem.length > 0) return elem[0];

      elem = await driver.findElements(By.xpath(notExistXpath))
      if (elem.length > 0) return elem[0];
  
      i++;
      if (i >= LIMIT_TRIES) return false;
      driver.sleep(100);
  
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
  const priceInfos = [];
  
  // const options = new chrome.Options().addArguments('--headless=new');
  const options = new chrome.Options();

  let driver;
  let priceInfo;

  for(let id = idFrom; id <= idTo; id++) {
    driver = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();


    try {
      priceInfo = await getPriceInfoFromPage(driver, id);
      if (priceInfo) priceInfos.push(priceInfo);

      if (priceInfos.length >= 10000) {
        // todo
      }
    } finally {
      await driver.quit();
    }
  }

  console.log(priceInfos);
}

const clientOptions = {
  database: 'ozon_prices',
  user: 'shu512',
  host: 'localhost',
  password: 'shu512',
  port: 5432
};

(async function example() {

  // const client = new Client(clientOptions);
  // await client.connect();

  // const args = priceInfos.reduce((arr, cur) => [...arr, cur.productId, cur.price], []);
  // // ($1::int, $2::int),($3::int, $4::int),($5::int, $6::int),($7::int, $8::int)
  // let queryArgs = priceInfos
  //   .reduce((query, cur, index) => query + `($${index * 2 + 1}::int, $${index * 2 + 2}::int),`, '')
  //   .slice(0, queryArgs.length - 1);
  // const query = `insert into prices (product_id, price) values ${queryArgs};`;
  // await client.query(query, args)

  
  
  // await client.query('DELETE FROM prices;', [])
  // const res = await client.query('SELECT * from prices;', [])
  // console.log(res.rows)
  // await client.end()

  const one = runSearch(1101013773, 1101013777);
  const two = runSearch(1101013760, 1101013765);
  await Promise.all([one, two]);


})();






// await driver.get('https://www.ozon.ru/product/1101013778'); // отсутствует
// await driver.get('https://www.ozon.ru/product/1101013777'); // скидка
// await driver.get('https://www.ozon.ru/product/1256931175'); // без скидки
// await driver.get('https://www.ozon.ru/product/1210967301'); // авто


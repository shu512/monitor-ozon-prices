require('dotenv').config()

const { logStarted, logFinished } = require('./utils/log');
const { loadToDb, showDbContent } = require('./utils/db');
const { Builder, Browser, By, ThenableWebDriver, WebElement } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const LIMIT_TRIES = 20;
const LIMIT_BATCH = 10000;

const priceXpath = "//div[@data-widget='webPrice']/descendant::span[contains(text(),'₽')]";
const outOfStockXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'Этот товар закончился')]";
const notDeliveryXpath = "//div[@data-widget='webOutOfStock']/h2[contains(text(),'не доставляется')]";
const notExistXpath = "//div[@data-widget='error']";
const plus18Xpath = "//span[contains(text(), 'Подтвердите возраст')]";

const cloudfareId = 'challenge-running';
const ozonBlockId = 'reload-button';

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

      elem = await driver.findElements(By.id(ozonBlockId));
      if (elem.length > 0) {
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

  driver = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();
  for(let id = idTo; id >= idFrom; id--) {
    try {
      priceInfo = await getPriceInfoFromPage(driver, id);
      if (priceInfo) priceInfos.push(priceInfo);

      if (priceInfos.length >= LIMIT_BATCH) {
        await loadToDb(priceInfos);
        priceInfos = [];
      }
    }
    catch(e) {
      console.log('catch', e);
    }
  }
  await driver.quit();

  await loadToDb(priceInfos);
  priceInfos = [];
}

function calculateSearcherOptions({ from, to, threads }) {
  const step = Math.ceil((to - from) / threads);
  const input = Array.from({ length: threads }).map((_, index) => ({
    from: step * index + from,
    to: step * (index + 1) + from - 1
  }));

  input[input.length - 1].to = to;
  return input;
}

(async function main() {
  // const input = {
  //   from    : 806075000,
  //   to      : 806076859,
  //   threads : 10,
  // };

  const input = {
    from    : 806070004,
    to      : 806070004,
    threads : 1,
  };
  
  const searcherOptions = calculateSearcherOptions(input);
  const startDate = logStarted(input);

  await Promise.all(
    searcherOptions.map(params => runSearch(params.from, params.to))
  );

  logFinished(input, startDate);

  // showDbContent();
})();

const { Builder, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * @async
 * @returns {ThenableWebDriver} driver 
 */
async function getDriver() {
  let options = new chrome
    .Options()
    .addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36');

  if (process.env.DISABLE_HEADLESS?.toLowerCase() !== 'true'){
    options = options.addArguments('--headless=new');
  }

  const driver = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();
  await setupCookies(driver);
  
  return driver;
}

/**
 * @async
 * @param {ThenableWebDriver} driver 
 */
async function setupCookies(driver) {
  await driver.get(`https://www.ozon.ru`);
  await driver.manage().addCookie({ name: 'is_adult_confirmed', value: 'true' });
  await driver.manage().addCookie({ name: 'adult_user_birthdate', value: '2001-11-11' });  
}

module.exports = {
  getDriver,
};

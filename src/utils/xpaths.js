const { ProductStatuses } = require('./product_statuses');

const XPaths = {
  price: {
    xpath: "//div[@data-widget='webPrice']/descendant::span[contains(text(),'₽')]",
    status: ProductStatuses.PRICE,
  },
  outOfStock: {
    xpath: "//div[@data-widget='webOutOfStock']/h2[contains(text(),'Этот товар закончился')]",
    status: ProductStatuses.OUT_OF_STOCK,
  },
  notDelivery: {
    xpath: "//div[@data-widget='webOutOfStock']/h2[contains(text(),'не доставляется')]",
    status: ProductStatuses.NOT_DELIVERY,
  },
  notExist: {
    xpath: "//div[@data-widget='error']/h2",
    status: ProductStatuses.NOT_EXIST,
  },
  plus18: {
    xpath: "//span[contains(text(), 'Подтвердите возраст')]",
    status: ProductStatuses.PLUS_18,
  },
};

module.exports = {
  XPaths,
}
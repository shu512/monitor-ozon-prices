const fs = require('fs');
const { DateTime } = require('luxon');

function logStarted({ from, to ,threads }) {
  const filename = process.env.LOG_FILE || ozon_prices.log;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  fs.appendFileSync(
    filename,
    `[${dateHumanized}]: Start scanning.  From: ${from}; to: ${to}; threads: ${threads}\n`
  );
  return date;
}

function logFinished({ from, to ,threads }, startDate) {
  const filename = process.env.LOG_FILE || ozon_prices.log;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const duration = date.diff(startDate);
  fs.appendFileSync(
    filename,
    `[${dateHumanized}]: Finish scanning. From: ${from}; to: ${to}; threads: ${threads}. Duration: ${duration.toHuman()}\n`
  );
}

module.exports = {
  logStarted,
  logFinished,
}
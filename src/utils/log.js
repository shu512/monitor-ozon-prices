const fs = require('fs');
const { DateTime } = require('luxon');

/**
 * Appends data to the file and close it
 * @param {string} filename
 * @param {string} data
 */
function append(filename, data) {
  let fd;
  try {
    fd = fs.openSync(filename, 'a');
    fs.appendFileSync(fd, data, 'utf8');
  } catch (err) {
    console.log('[ERROR]: Unable to log to file:', err);
  } finally {
    if (fd !== undefined)
      fs.closeSync(fd);
  }
}

/**
 * Logs the start scanning time to the file
 * @param {{ from: number, to: number, threads: number}}
 * @returns {DateTime<true>}
 */
function logStarted({ from, to ,threads }) {
  const filename = process.env.LOG_FILE || 'ozon_prices.log';
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  append(
    filename,
    `[${dateHumanized}]: Start scanning.  From: ${from}; to: ${to}; threads: ${threads}\n`
  );
  return date;
}

/**
 * Logs the finish scanning time and duration to the file
 * @param {{ from: number, to: number, threads: number}}
 * @returns {DateTime<true>}
 */
function logFinished({ from, to ,threads }, startDate) {
  const filename = process.env.LOG_FILE || 'ozon_prices.log';
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const duration = date.diff(startDate);
  append(
    filename,
    `[${dateHumanized}]: Finish scanning. From: ${from}; to: ${to}; threads: ${threads}. Duration: ${duration.toHuman()}\n`
  );
}

module.exports = {
  logStarted,
  logFinished,
}
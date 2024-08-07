const fs = require('fs');
const { DateTime } = require('luxon');

const DEFAULT_FILENAME = 'run.log';
const DEFAULT_FILENAME_ERRORS = 'errors.log';
const DEFAULT_FILENAME_SEARCH = 'run_search.log';

function logConsole(msg) {
  if (process.env.CONSOLE_DEBUG?.toLowerCase() === 'true'){
    console.log(msg);
  }
}

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
    logConsole(data);
  } catch (err) {
    const msg = '[ERROR]: Unable to log to file: ';
    logConsole(msg + err);
  } finally {
    if (fd !== undefined)
      fs.closeSync(fd);
  }
}

/**
 * Logs the error
 * @param {string} msg
 * @param {Exception} err
 */
function logError(msg, err) {
  const dateHumanized = DateTime.now().toLocaleString(DateTime.DATETIME_FULL);
  const filename = process.env.ERROR_LOG_FILE || DEFAULT_FILENAME_ERRORS;
  append(filename, `[${dateHumanized}]: ${msg + err}\n`);
}

/**
 * Logs the start search time to the file
 * @param {{ from: number, to: number, threads: number}}
 * @returns {DateTime<true>}
 */
function logStartSeach({ from, to ,threads }) {
  const filename = process.env.SEARCH_LOG_FILE || DEFAULT_FILENAME_SEARCH;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const msg = `[${dateHumanized}]: Start search.  From: ${from}; to: ${to}; threads: ${threads}\n`;
  append(filename, msg);
  return date;
}

/**
 * Logs the finish search time and duration to the file
 * @param {{ from: number, to: number, threads: number}}
 * @param {DateTime<true>} startDate
 */
function logFinishSearch({ from, to ,threads }, startDate) {
  const filename = process.env.SEARCH_LOG_FILE || DEFAULT_FILENAME_SEARCH;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const duration = date.diff(startDate);
  const msg = `[${dateHumanized}]: Finish search. From: ${from}; to: ${to}; threads: ${threads}. Duration: ${duration.toHuman()}\n`;
  append(filename, msg);
}

/**
 * Logs the start monitoring time with parameters
 * @param {number} leftBorder
 * @param {number} rightBorder
 * @returns {DateTime<true>}
 */
function logStart(leftBorder, rightBorder) {
  const filename = process.env.LOG_FILE || DEFAULT_FILENAME;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const msg = `[${dateHumanized}]: Start scanning. From: ${leftBorder}; to: ${rightBorder}\n`;
  append(filename, msg);
  return date;
}

/**
 * Logs the finish monitoring time with parameters and duration
 * @param {number} leftBorder
 * @param {number} rightBorder
 * @param {DateTime<true>} startDate
 */
function logFinish(leftBorder, rightBorder, startDate) {
  const filename = process.env.LOG_FILE || DEFAULT_FILENAME;
  const date = DateTime.now();
  const dateHumanized = date.toLocaleString(DateTime.DATETIME_FULL);
  const duration = date.diff(startDate);
  const msg = `[${dateHumanized}]: Finish scanning. From: ${leftBorder}; to: ${rightBorder}. Duration: ${duration.toHuman()}\n`;
  append(filename, msg);
}

module.exports = {
  logStartSeach,
  logFinishSearch,
  logStart,
  logFinish,
}

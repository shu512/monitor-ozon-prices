/**
 * @param {string} priceText - e.g. "1 309 ₽"
 * @returns {number} e.g. 1309
 */
function getPriceFromText(priceText) {
  const text = priceText.replace("₽", "").replace(/ /g, "");
  return parseFloat(text);
}

/**
 * Returns actual product ids to check
 * 
 * E.g. for input
 * 
 *     {
 *       from:10, 
 *       to: 19,
 *       threads: 3
 *     }
 * and skip = 
 * 
 *     [ 13, 16 ]
 * 
 * the result will be 
 *
 *     [ 10, 11, 12, 14, 15, 17, 18, 19 ]
 * @param {{ from: number, to: number }} input
 * @param {number[]} skips array of ids to skip
 * @returns {number[]}
 */
function getActualIds({ from, to }, skips) {
  let i = from;
  return Array
    .from({length: to - from + 1}, () => i++)
    .filter(id => !skips.find(skipId => skipId === id));
}

/**
 * Splits an array into parts
 * 
 * E.g. for array
 * 
 *     [ 10, 11, 12, 14, 15, 17, 18, 19 ]
 * and chunks = 
 * 
 *     3
 * 
 * the result will be 
 *
 *     [ [ 10, 11, 12 ], [ 14, 15, 17 ], [ 18, 19 ] ]
 * @param {number[]} array
 * @param {number} chunks
 * @returns {number[][]}
 */
function splitArray(array, chunks) {
  let input = [];
  for (let i = chunks; i > 0; i--) {
    input.push(array.splice(0, Math.ceil(array.length / i)));
  }

  return input;
}

module.exports = {
  getActualIds,
  getPriceFromText,
  splitArray,
};

/**
 * @param {string} priceText - e.g. "1 309 ₽"
 * @returns {number} e.g. 1309
 */
function getPriceFromText(priceText) {
  const text = priceText.replace("₽", "").replace(/ /g, "");
  return parseFloat(text);
}

/**
 * Splits the range (from -> to) by the number of threads
 * 
 * E.g. for input
 * 
 *     {
 *       from:1, 
 *       to: 10,
 *       threads: 3
 *     }
 * 
 * the result will be 
 *
 *     [ { from: 1, to: 3 }, { from: 4, to: 6 }, { from: 7, to: 10 } ]
 * @param {{ from: number, to: number, threads: number}} input
 * @returns {{ from: number; to: number;}[]}
 */
function calculateSearcherOptions({ from, to, threads }) {
  const step = Math.ceil((to - from) / threads);
  const input = Array.from({ length: threads }).map((_, index) => ({
    from: step * index + from,
    to: step * (index + 1) + from - 1
  }));

  input[input.length - 1].to = to;
  return input;
}

module.exports = {
  calculateSearcherOptions,
  getPriceFromText
};

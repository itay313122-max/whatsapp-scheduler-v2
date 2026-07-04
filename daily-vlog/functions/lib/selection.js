// Pure "bag without replacement" selection — no Firebase, so it's unit-tested.
// Nobody repeats until everyone has had a turn; then the bag refills and the
// round number increments.

/**
 * @param {{ memberIds?: string[], currentBagPool?: string[], roundNumber?: number }} group
 * @param {() => number} rand injectable RNG (defaults to Math.random) for tests
 * @returns {null | { userId: string, currentBagPool: string[], roundNumber: number }}
 */
function pickNextVlogger(group, rand = Math.random) {
  let pool = Array.isArray(group.currentBagPool) ? [...group.currentBagPool] : [];
  let round = group.roundNumber || 0;

  // Empty bag → start a new round with everyone back in.
  if (pool.length === 0) {
    pool = Array.isArray(group.memberIds) ? [...group.memberIds] : [];
    round = round + 1;
  }
  if (pool.length === 0) return null; // no members at all

  const idx = Math.floor(rand() * pool.length);
  const userId = pool[idx];
  const currentBagPool = pool.filter((_, i) => i !== idx);
  return { userId, currentBagPool, roundNumber: round };
}

module.exports = { pickNextVlogger };

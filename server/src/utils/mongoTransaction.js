const mongoose = require('mongoose');

/**
 * @param {unknown} error
 */
function isTransactionNotSupportedError(error) {
  const message = String(error?.message || '');
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('mongos')
  );
}

/**
 * Replica set이 있으면 트랜잭션으로 실행하고, standalone이면 session 없이 fallback.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} work
 * @returns {Promise<T>}
 */
async function runInTransaction(work) {
  let session = null;

  try {
    session = await mongoose.startSession();
  } catch {
    return work(null);
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      return work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  runInTransaction,
  isTransactionNotSupportedError,
};

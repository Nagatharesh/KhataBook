/** js/lib/balance.js — Browser ES module version */

function toPaise(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export function calculateBalance(transactions) {
  if (!transactions || transactions.length === 0) return { runningBalances: [], finalBalance: 0 };

  const sorted = [...transactions].sort((a, b) => {
    const da = new Date(a.transaction_date).getTime();
    const db = new Date(b.transaction_date).getTime();
    if (da !== db) return da - db;

    const ca = new Date(a.created_at || 0).getTime();
    const cb = new Date(b.created_at || 0).getTime();
    if (ca !== cb) return ca - cb;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  let running = 0;
  const runningBalances = sorted.map(tx => {
    const amount = toPaise(tx.amount_paise);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new RangeError(`Invalid amount_paise=${tx.amount_paise} on transaction ${tx.id || 'unknown'}`);
    }
    if (tx.type === 'lent') running += amount;
    else if (tx.type === 'repaid') running -= amount;
    else throw new TypeError(`Unknown type "${tx.type}"`);

    return { ...tx, amount_paise: amount, balance_after_paise: running };
  });

  return { runningBalances, finalBalance: running };
}

export function computeFinalBalance(transactions) {
  return calculateBalance(transactions).finalBalance;
}

export function verifyBalanceSnapshot(transactions, stored) {
  const computed = computeFinalBalance(transactions);
  const storedNum = toPaise(stored);
  return { matches: computed === storedNum, computed, stored: storedNum };
}

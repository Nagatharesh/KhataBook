/** js/lib/reversal.js — Browser ES module version */
import { generateClientRequestId } from './format.js';

export function reverseTransaction(originalTx, options = {}) {
  if (!originalTx?.id) throw new TypeError('originalTransaction must have an id');
  if (!['lent','repaid'].includes(originalTx.type)) throw new TypeError(`Invalid type "${originalTx.type}"`);
  if (!originalTx.customer_id) throw new TypeError('customer_id required');
  const amount = Number(originalTx.amount_paise);
  if (!Number.isInteger(amount) || amount <= 0) throw new RangeError('amount_paise must be positive integer');

  const reversingType = originalTx.type === 'lent' ? 'repaid' : 'lent';
  const origDate = new Date(originalTx.transaction_date).toLocaleDateString('en-IN');
  const defaultNote = `Reversal of ${originalTx.type === 'lent' ? 'Lent' : 'Repaid'} ₹${(amount/100).toFixed(2)} on ${origDate}` +
    (originalTx.note ? ` (original: "${originalTx.note}")` : '');

  // created_by must be the current user's actual auth UID, not a placeholder
  // The actual userId will be resolved by customerStore.createTransaction
  return {
    client_request_id: generateClientRequestId(),
    customer_id: originalTx.customer_id,
    type: reversingType,
    amount_paise: amount,
    transaction_date: options.date || new Date().toISOString(),
    note: options.note !== undefined ? options.note : defaultNote,
    reversed_transaction_id: originalTx.id,
    // Don't set created_by here — let customerStore.createTransaction fill it
  };
}

export function isReversed(tx, allTransactions) {
  return allTransactions.some(t => t.reversed_transaction_id === tx.id);
}
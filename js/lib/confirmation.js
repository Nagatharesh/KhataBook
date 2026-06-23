/** js/lib/confirmation.js — Browser ES module version */
import { formatAmount, formatAmountAbs, toIntegerPaise } from './format.js';

export function buildConfirmationSummary(customer, currentBalance_paise, newTransaction) {
  if (!customer?.name) throw new TypeError('customer.name required');
  const currentBal = toIntegerPaise(currentBalance_paise);
  if (!Number.isInteger(currentBal)) throw new TypeError('currentBalance_paise must be integer');
  const { type, amount_paise, date, note = '' } = newTransaction;
  const amount = toIntegerPaise(amount_paise);
  if (!Number.isInteger(amount) || amount <= 0) throw new RangeError('amount_paise must be positive integer');

  let balanceAfter_paise;
  if (type === 'lent')        balanceAfter_paise = currentBal + amount;
  else if (type === 'repaid') balanceAfter_paise = currentBal - amount;
  else throw new TypeError(`Unknown type "${type}"`);

  const isOverpayment = type === 'repaid' && amount > currentBal;
  const willGoNegative = balanceAfter_paise < 0;

  let warningMessage = null;
  if (isOverpayment) {
    const excess = amount - currentBal;
    warningMessage =
      `This payment is ${formatAmountAbs(excess)} more than what ${customer.name} currently owes. ` +
      `Their balance will go to -${formatAmountAbs(balanceAfter_paise)}, meaning you now owe them that amount. Continue?`;
  }

  let balanceAfterLabel;
  if (balanceAfter_paise > 0) balanceAfterLabel = `${customer.name} will owe you ${formatAmount(balanceAfter_paise)}`;
  else if (balanceAfter_paise === 0) balanceAfterLabel = `Fully settled — ₹0.00 balance`;
  else balanceAfterLabel = `You will owe ${customer.name} ${formatAmountAbs(balanceAfter_paise)} (credit)`;

  return {
    customerName: customer.name, customerPhone: customer.phone || '',
    type, amount_paise: amount, amountFormatted: formatAmount(amount),
    date: date || new Date().toISOString(), note,
    balanceBefore_paise: currentBal,
    balanceAfter_paise,
    balanceBeforeFormatted: formatAmount(currentBal),
    balanceAfterFormatted: formatAmount(balanceAfter_paise),
    isOverpayment, willGoNegative, warningMessage, balanceAfterLabel,
  };
}

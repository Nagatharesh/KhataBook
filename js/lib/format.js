/**
 * js/lib/format.js — Browser ES module version
 * Same logic as src/lib/format.js but using ES module export syntax.
 */

const _inFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatIndianNumber(paise) {
  if (paise === null || paise === undefined) throw new TypeError('formatIndianNumber: paise required');
  const n = typeof paise === 'bigint' ? paise : BigInt(Math.trunc(Number(paise)));
  const isNeg = n < 0n;
  const absN = isNeg ? -n : n;
  const rupees = absN / 100n;
  const remainingPaise = absN % 100n;
  const formatted = _inFormatter.format(Number(rupees) + Number(remainingPaise) / 100);
  return (isNeg ? '-₹' : '₹') + formatted;
}

/** Coerce DB / form values to integer paise — prevents string-concat bugs from Supabase bigint strings */
export function toIntegerPaise(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export function parseIndianNumberInput(input) {
  if (typeof input !== 'string') return { ok: false, error: 'Input must be a string' };
  let cleaned = input.replace(/₹/g, '').replace(/,/g, '').trim();
  // Allow trailing decimal while typing, e.g. "100."
  if (cleaned.endsWith('.')) cleaned = cleaned.slice(0, -1);
  if (cleaned === '') return { ok: false, error: 'Amount is required' };
  if (cleaned.startsWith('-')) return { ok: false, error: 'Amount must be positive. Use Lent/Repaid to indicate direction.' };
  if (/[eE]/.test(cleaned)) return { ok: false, error: 'Scientific notation not accepted.' };
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return { ok: false, error: 'Only digits and a single decimal point are allowed.' };
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1 && cleaned.length - dotIndex - 1 > 2) return { ok: false, error: 'At most 2 decimal places (paise) allowed.' };
  let paise;
  if (dotIndex === -1) {
    paise = BigInt(cleaned) * 100n;
  } else {
    const rupeePart = cleaned.slice(0, dotIndex) || '0';
    const paisePart = cleaned.slice(dotIndex + 1).padEnd(2, '0').slice(0, 2);
    paise = BigInt(rupeePart) * 100n + BigInt(paisePart);
  }
  const paiseNum = Number(paise);
  if (paise <= BigInt(Number.MAX_SAFE_INTEGER)) return { ok: true, paise: paiseNum };
  return { ok: true, paise };
}

export function formatAmount(paise)    { return formatIndianNumber(paise); }
export function formatAmountAbs(paise) {
  const n = typeof paise === 'bigint' ? paise : BigInt(Math.trunc(Number(paise)));
  return formatIndianNumber(n < 0n ? -n : n);
}

export function generateClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Format a Date or ISO string as a locale date string */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format a Date or ISO string as date + time */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

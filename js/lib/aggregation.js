/** js/lib/aggregation.js — Browser ES module version */

export function getPeriodStart(date, period) {
  const d = new Date(date);
  switch (period) {
    case 'day':   return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    case 'week': {
      const day = d.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    }
    case 'month': return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    default: throw new TypeError(`Unknown period "${period}"`);
  }
}

function nextPeriodStart(ps, period) {
  const d = new Date(ps);
  switch (period) {
    case 'day':   return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
    case 'week':  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7));
    case 'month': return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    default: throw new TypeError(`Unknown period "${period}"`);
  }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatPeriodLabel(periodStart, period) {
  const d = new Date(periodStart);
  switch (period) {
    case 'day':   return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    case 'week': {
      const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
      const weekNum = Math.ceil(((d - jan4) / 86400000 + jan4.getUTCDay() + 1) / 7);
      return `W${weekNum} ${d.getUTCFullYear()}`;
    }
    case 'month': return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    default: return new Date(periodStart).toISOString().slice(0, 10);
  }
}

export function aggregateByPeriod(transactions, period, options = {}) {
  if (!['day','week','month'].includes(period)) throw new TypeError(`Invalid period "${period}"`);
  if (!transactions?.length) return [];

  const txDates = transactions.map(tx => new Date(tx.transaction_date).getTime());
  const minDate = new Date(Math.min(...txDates));
  const maxDate = new Date(Math.max(...txDates));
  const rangeStart = options.rangeStart ? new Date(options.rangeStart) : minDate;
  const rangeEnd   = options.rangeEnd   ? new Date(options.rangeEnd)   : maxDate;

  const bucketMap = new Map();
  for (const tx of transactions) {
    const ps = getPeriodStart(new Date(tx.transaction_date), period);
    const key = ps.toISOString();
    if (!bucketMap.has(key)) bucketMap.set(key, { totalLent_paise: 0, totalRepaid_paise: 0, periodStart: ps });
    const b = bucketMap.get(key);
    const amount = Number(tx.amount_paise);
    if (tx.type === 'lent')        b.totalLent_paise   += amount;
    else if (tx.type === 'repaid') b.totalRepaid_paise += amount;
  }

  const result = [];
  let cursor = getPeriodStart(rangeStart, period);
  while (cursor.getTime() <= rangeEnd.getTime()) {
    const key = cursor.toISOString();
    const b = bucketMap.get(key) || { totalLent_paise: 0, totalRepaid_paise: 0 };
    result.push({
      period: key,
      periodLabel: formatPeriodLabel(cursor, period),
      totalLent_paise:   b.totalLent_paise,
      totalRepaid_paise: b.totalRepaid_paise,
      net_paise: b.totalLent_paise - b.totalRepaid_paise,
    });
    cursor = nextPeriodStart(cursor, period);
  }
  return result;
}

export function computeDashboardSummary(transactions) {
  if (!transactions?.length) return { totalLent_paise: 0, totalRepaid_paise: 0, netOutstanding_paise: 0 };
  let lent = 0, repaid = 0;
  for (const tx of transactions) {
    const a = Number(tx.amount_paise);
    if (tx.type === 'lent')        lent   += a;
    else if (tx.type === 'repaid') repaid += a;
  }
  return { totalLent_paise: lent, totalRepaid_paise: repaid, netOutstanding_paise: lent - repaid };
}

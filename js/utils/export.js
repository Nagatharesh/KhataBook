/**
 * js/utils/export.js — SQL / CSV / JSON export
 */

import { customerStore } from '../store/customerStore.js';

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

function walletToSQL(w) {
  if (!w) return '-- Wallet table is not active for this export';
  return `INSERT INTO wallets (id, user_id, name, status, created_at, updated_at) VALUES ` +
    `(${esc(w.id)}, ${esc(w.user_id)}, ${esc(w.name)}, ${esc(w.status)}, ${esc(w.created_at)}, ${esc(w.updated_at)});`;
}

function customerToSQL(c) {
  return `INSERT INTO customers (id, name, phone, email, location, district, notes, created_at, created_by, wallet_id) VALUES ` +
    `(${esc(c.id)}, ${esc(c.name)}, ${esc(c.phone)}, ${esc(c.email)}, ${esc(c.location)}, ${esc(c.district)}, ${esc(c.notes)}, ${esc(c.created_at)}, ${esc(c.created_by)}, ${esc(c.wallet_id)});`;
}

function txToSQL(t) {
  return `INSERT INTO transactions (id, client_request_id, customer_id, wallet_id, type, amount_paise, balance_after_paise, transaction_date, note, reversed_transaction_id, created_at, created_by) VALUES ` +
    `(${esc(t.id)}, ${esc(t.client_request_id)}, ${esc(t.customer_id)}, ${esc(t.wallet_id)}, ${esc(t.type)}, ${t.amount_paise}, ${t.balance_after_paise}, ${esc(t.transaction_date)}, ${esc(t.note)}, ${esc(t.reversed_transaction_id)}, ${esc(t.created_at)}, ${esc(t.created_by)});`;
}

export async function exportSQL() {
  const { wallet, customers, transactions, exportedAt } = await customerStore.exportSnapshot();
  const lines = [
    `-- KhataBook Export — ${exportedAt}`,
    wallet ? `-- Wallet: ${wallet.name}` : '-- Wallet: legacy mode, wallet table not active',
    `-- Customers: ${customers.length} | Transactions: ${transactions.length}`,
    '',
    `-- SCHEMA DEFINITION`,
    `DROP TABLE IF EXISTS transactions;`,
    `DROP TABLE IF EXISTS customers;`,
    `DROP TABLE IF EXISTS wallets;`,
    ``,
    `CREATE TABLE wallets (`,
    `    id TEXT PRIMARY KEY,`,
    `    user_id TEXT NOT NULL,`,
    `    name TEXT NOT NULL,`,
    `    status TEXT NOT NULL,`,
    `    created_at TEXT,`,
    `    updated_at TEXT`,
    `);`,
    ``,
    `CREATE TABLE customers (`,
    `    id TEXT PRIMARY KEY,`,
    `    name TEXT NOT NULL,`,
    `    phone TEXT,`,
    `    email TEXT,`,
    `    location TEXT,`,
    `    district TEXT,`,
    `    notes TEXT,`,
    `    created_at TEXT,`,
    `    created_by TEXT,`,
    `    wallet_id TEXT`,
    `);`,
    ``,
    `CREATE TABLE transactions (`,
    `    id TEXT PRIMARY KEY,`,
    `    client_request_id TEXT,`,
    `    customer_id TEXT,`,
    `    wallet_id TEXT,`,
    `    type TEXT,`,
    `    amount_paise BIGINT,`,
    `    balance_after_paise BIGINT,`,
    `    transaction_date TEXT,`,
    `    note TEXT,`,
    `    reversed_transaction_id TEXT,`,
    `    created_at TEXT,`,
    `    created_by TEXT`,
    `);`,
    '',
    '-- WALLET',
    walletToSQL(wallet),
    '',
    '-- CUSTOMERS',
    ...customers.map(customerToSQL),
    '',
    '-- TRANSACTIONS',
    ...transactions.map(txToSQL),
    '',
  ];
  return lines.join('\n');
}

function csvRow(arr) {
  return arr.map(v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

export async function exportCSV() {
  const { wallet, customers, transactions } = await customerStore.exportSnapshot();

  const customerMap = {};
  for (const c of customers) {
    customerMap[c.id] = c;
  }

  const header = csvRow([
    'Wallet',
    'Transaction Date',
    'Customer Name',
    'Customer Phone',
    'Customer Location',
    'Type',
    'Amount (₹)',
    'Running Balance (₹)',
    'Note',
    'Transaction ID',
    'Reversed Transaction ID'
  ]);

  const rows = transactions.map(t => {
    const c = customerMap[t.customer_id] || {};
    const formattedDate = new Date(t.transaction_date).toLocaleString('en-IN');
    const typeLabel = t.type === 'lent' ? 'Lent' : 'Repaid';
    const amountRs = (t.amount_paise / 100).toFixed(2);
    const balanceRs = (t.balance_after_paise / 100).toFixed(2);

    return csvRow([
      wallet ? wallet.name : 'Legacy mode',
      formattedDate,
      c.name || 'Unknown',
      c.phone || '',
      c.location || '',
      typeLabel,
      amountRs,
      balanceRs,
      t.note || '',
      t.id,
      t.reversed_transaction_id || ''
    ]);
  });

  return [header, ...rows].join('\n');
}

export async function exportJSON() {
  const snap = await customerStore.exportSnapshot();
  return JSON.stringify(snap, null, 2);
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function triggerExport(format) {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === 'sql') {
    const sql = await exportSQL();
    downloadFile(sql, `khatabook-export-${ts}.sql`, 'text/plain');
  } else if (format === 'json') {
    const json = await exportJSON();
    downloadFile(json, `khatabook-export-${ts}.json`, 'application/json');
  } else if (format === 'csv') {
    const csv = await exportCSV();
    downloadFile(csv, `khatabook-ledger-${ts}.csv`, 'text/csv');
  }
}

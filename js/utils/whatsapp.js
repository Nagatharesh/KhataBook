/**
 * js/utils/whatsapp.js — WhatsApp Bill Message Generator
 * Uses wa.me deep links to open WhatsApp with pre-filled billing message.
 * No API cost, no verification required.
 */

export function generateWhatsAppBill({
  customerName,
  amountPaise,
  txType,
  dateTime,
  balancePaise,
  transactionId,
  previousBalancePaise = 0,
}) {
  const amount = (amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const prevBalance = (previousBalancePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const newBalance = (balancePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const typeLabel = txType === 'lent' ? 'LENT / GIVEN' : 'REPAYMENT / RECEIVED';

  const formattedDate = new Date(dateTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const lines = [
    '═══════════════════════════════════',
    '',
    '            KHATABOOK',
    '         BUSINESS LEDGER',
    '',
    '═══════════════════════════════════',
    '',
    `  Customer : ${customerName}`,
    '',
    '───────────────────────────────────',
    '',
    '       TRANSACTION DETAILS',
    '',
    `  Type       : ${typeLabel}`,
    `  Amount     : ₹${amount}`,
    `  Date & Time: ${formattedDate}`,
    '',
    '───────────────────────────────────',
    '',
    '       BALANCE BREAKDOWN',
    '',
    `  Opening Bal: ₹${prevBalance}`,
    txType === 'lent'
      ? `  + Lent      : ₹${amount}`
      : `  - Repaid    : ₹${amount}`,
    '  ────────────────────────────────',
    `  *Final Bal : ₹${newBalance}*`,
    '',
    '───────────────────────────────────',
    '',
    `  Reference  : ${transactionId.slice(0, 8).toUpperCase()}`,
    '',
    '═══════════════════════════════════',
    '',
    'This is an auto-generated message',
    'from KhataBook Business Ledger.',
    '',
    'For queries, quote the Reference',
    'number above.',
    '',
    'Thank you for your business!',
    '',
    '═══════════════════════════════════',
  ];

  return lines.join('\n');
}

export function openWhatsAppWithBill(phoneNumber, message) {
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  if (!cleanedPhone || cleanedPhone.length < 10) {
    throw new Error('Invalid phone number');
  }
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/91${cleanedPhone}?text=${encoded}`, '_blank');
}

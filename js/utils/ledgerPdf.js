/**
 * js/utils/ledgerPdf.js — Traditional Ledger Book PDF Generator
 * Generates PDFs that look like physical accountant's ledger books
 */

// Lazy-get jsPDF from global scope (loaded via CDN)
function getJsPDF() {
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }
  throw new Error('jsPDF library not loaded. Add the CDN script to index.html');
}

export async function generateLedgerPDF({
  customer,
  transactions,
  shopInfo = {}
}) {
  const jsPDF = getJsPDF();

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const lineHeight = 6;
  const fontSize = 9;
  
  // Fonts and styling
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  
  // Shop info defaults
  const shopName = shopInfo.name || 'KhataBook';
  
  // Header
  let yPos = drawHeader(doc, pageWidth, margin, shopName);
  
  // Customer info
  const genDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
yPos = drawCustomerInfo(doc, customer, yPos, margin, lineHeight, pageWidth, genDate);

  // Opening balance
  const openingBalance = customer.opening_balance_paise || 0;
  yPos = drawOpeningBalance(doc, openingBalance, yPos, margin, lineHeight, fontSize);

  // Table setup
  const tableHeaders = ['Date', 'Type', 'Amount', 'Running Balance', 'Note'];
  const colWidths = [25, 20, 25, 30, 75];
  const tableLeft = margin;

  let currentPage = 1;
  yPos = drawTableHeader(doc, tableHeaders, colWidths, tableLeft, yPos, lineHeight, fontSize, margin);

  // Transaction rows
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    // Check page overflow
    if (yPos > pageHeight - 30) {
      doc.addPage();
      currentPage++;
      yPos = drawPageHeader(doc, pageWidth, margin, shopName, currentPage);
      yPos = drawTableHeader(doc, tableHeaders, colWidths, tableLeft, yPos, lineHeight, fontSize, margin);
    }

    yPos = drawTransactionRow(
      doc, tx,
      tableLeft, yPos, colWidths, lineHeight, fontSize,
      false, // no shading - removed to fix black box issue
      margin
    );
  }

  // Closing balance and summary - use last transaction's balance or customer balance
  let finalBalance = customer.balance_paise || 0;
  if (transactions.length > 0 && transactions[0].balance_after_paise) {
    finalBalance = transactions[0].balance_after_paise;
  }
  yPos = drawClosingSummary(
    doc, pageHeight, margin, lineHeight, fontSize,
    finalBalance
  );

  // Footer
  drawFooter(doc, pageWidth, pageHeight, margin, shopName, currentPage);
  
  return doc;
}

function drawHeader(doc, pageWidth, margin, shopName) {
  let yPos = margin;
  
  // Shop name centered
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(shopName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  
  // Ledger title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LEDGER BOOK', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  
  // Top border line
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;
  
  return yPos;
}

function drawPageHeader(doc, pageWidth, margin, shopName, pageNumber) {
  // Simple page header for continuation pages
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${shopName} - Page ${pageNumber}`, pageWidth / 2, margin - 4, { align: 'center' });
  
  doc.setLineWidth(0.1);
  doc.line(margin, margin, pageWidth - margin, margin);
  
  return margin + 6;
}

function drawCustomerInfo(doc, customer, yPos, margin, lineHeight, pageWidth, genDate) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Customer Name : ${customer.name}`, margin, yPos);
  yPos += lineHeight;
  
  doc.text(`Mobile        : ${customer.phone || '-'}`, margin, yPos);
  yPos += lineHeight;
  
  if (customer.location) {
    doc.text(`Address       : ${customer.location}${customer.district ? ', ' + customer.district : ''}`, margin, yPos);
    yPos += lineHeight;
  }
  
  // Generated date on right
  doc.text(`Generated: ${genDate}`, pageWidth - margin, yPos, { align: 'right' });
  
  return yPos + 4;
}

function drawOpeningBalance(doc, balance, yPos, margin, lineHeight, fontSize) {
  const formatted = `Rs.${(balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  doc.setFontSize(fontSize);
  doc.text(`Opening Balance: ${formatted}`, margin, yPos);
  
  // Underline
  doc.line(margin, yPos + 0.5, margin + 40, yPos + 0.5);
  
  return yPos + lineHeight + 2;
}

function drawTableHeader(doc, headers, widths, left, yPos, lineHeight, fontSize, margin) {
  doc.setFontSize(fontSize + 1);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245); // Light gray
  
  // Draw header cells
  for (let i = 0; i < headers.length; i++) {
    doc.rect(left, yPos - 4, widths[i], lineHeight + 2, 'F');
    doc.text(headers[i], left + 1, yPos);
    left += widths[i];
  }
  
  // Border below header
  doc.setLineWidth(0.1);
  doc.line(margin, yPos + 1, doc.internal.pageSize.getWidth() - margin, yPos + 1);
  
  return yPos + lineHeight + 4;
}

function drawTransactionRow(doc, tx, left, yPos, widths, lineHeight, fontSize, shaded, margin) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');

  const date = new Date(tx.transaction_date);
  const txDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const amount = (tx.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const runningBal = ((tx.balance_after_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const typeLabel = tx.type === 'lent' ? 'Lent' : 'Repaid';
  const note = tx.note || (tx.type === 'lent' ? 'Cash given' : 'Cash received');

  const totalWidth = widths.reduce((a, b) => a + b, 0);

  // Draw shaded background BEFORE text
  if (shaded) {
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, yPos - 4, totalWidth, lineHeight + 2, 'F');
  }

  // Date
  doc.text(txDate, left + 1, yPos);
  left += widths[0];

  // Type
  doc.text(typeLabel, left + 1, yPos);
  left += widths[1];

  // Amount
  const amountColor = tx.type === 'lent' ? [0, 100, 0] : [180, 0, 0];
  doc.setTextColor(...amountColor);
  doc.text(amount, left + widths[2] - doc.getTextWidth(amount) - 1, yPos);
  doc.setTextColor(0, 0, 0);
  left += widths[2];

  // Running Balance
  doc.setFont('helvetica', 'bold');
  doc.text(runningBal, left + widths[3] - doc.getTextWidth(runningBal) - 1, yPos);
  left += widths[3];

  // Note
  doc.setFont('helvetica', 'normal');
  const splitNote = doc.splitTextToSize(note.substring(0, 35), widths[4] - 2);
  doc.text(splitNote, left + 1, yPos);

  return yPos + lineHeight + 4;
}

function drawClosingSummary(doc, pageHeight, margin, lineHeight, fontSize, finalBal) {
  let yPos = doc.internal.pageSize.getHeight() - 35;
  
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
  yPos += 4;
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  
  const finalFormatted = (finalBal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  doc.text(`Closing Balance : Rs.${finalFormatted}`, margin, yPos);
  
  return yPos + lineHeight;
}

function drawFooter(doc, pageWidth, pageHeight, margin, shopName, currentPage) {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated by ${shopName}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// Export trigger function
export function triggerLedgerDownload(customer, transactions) {
  generateLedgerPDF({ customer, transactions })
    .then(doc => {
      const fileName = `Ledger-${customer.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    })
    .catch(err => {
      console.error('PDF generation failed:', err);
    });
}
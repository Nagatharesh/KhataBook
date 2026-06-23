/**
 * js/pages/customerDetail.js
 */
import { customerStore } from '../store/customerStore.js';
import { formatAmount, formatDate } from '../lib/format.js';
import { isReversed, reverseTransaction } from '../lib/reversal.js';
import { buildConfirmationSummary } from '../lib/confirmation.js';
import { showConfirmationModal, showDeleteConfirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { generateWhatsAppBill, openWhatsAppWithBill } from '../utils/whatsapp.js';
import { triggerLedgerDownload } from '../utils/ledgerPdf.js';

export async function renderCustomerDetail(root, customerId) {
  root.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const customer = await customerStore.getCustomer(customerId);
    const transactions = await customerStore.getTransactions(customerId);
    
    const isZero = customer.balance_paise === 0;
    const isNeg = customer.balance_paise < 0;
    const balClass = isZero ? 'zero' : isNeg ? 'negative' : 'positive';
    const balLabel = isZero ? 'Fully Settled' : isNeg ? 'You owe them' : 'They owe you';

    root.innerHTML = `
      <div class="page-header mb-16">
        <a href="#/customers" class="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </a>
      </div>

      <div class="grid-2 mb-24">
        <div class="card card-sm">
          <div class="flex-between mb-16">
            <div class="flex items-center gap-12">
              <div class="customer-avatar">${customer.name.charAt(0)}</div>
              <div>
                <h2 class="font-outfit fw-700 heading-lg">${customer.name}</h2>
                <div class="text-sm text-muted mt-4">${customer.district}</div>
              </div>
            </div>
            <a href="#/customers/${customer.id}/edit" class="btn btn-ghost btn-icon-only" title="Edit customer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </a>
            <button type="button" class="btn btn-ghost btn-icon-only delete-customer-btn" title="Delete customer" style="color:var(--accent-red)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-key">Phone</span>
              <span class="detail-val">${customer.phone || '—'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Location</span>
              <span class="detail-val">${customer.location || '—'}</span>
            </div>
            ${customer.email ? `
            <div class="detail-item">
              <span class="detail-key">Email</span>
              <span class="detail-val">${customer.email}</span>
            </div>` : ''}
          </div>
          ${customer.notes ? `
            <div class="detail-item mt-16 pt-16" style="border-top:1px solid var(--border)">
              <span class="detail-key">Notes</span>
              <span class="detail-val" style="color:var(--text-2);font-weight:400">${customer.notes}</span>
            </div>
          ` : ''}
        </div>

        <div class="balance-hero">
          <div class="balance-label">${balLabel}</div>
          <div class="balance-amount ${balClass}">${formatAmount(customer.balance_paise)}</div>
          <div class="balance-sub">
            Last updated: ${customer.last_transaction ? formatDate(customer.last_transaction) : 'Never'}
          </div>
        </div>
      </div>

      <div class="flex-between mb-16">
        <h3 class="section-title" style="margin:0">Transaction History</h3>
        <div class="flex gap-12">
          ${transactions.length > 0 ? `
            <button class="btn btn-ghost btn-sm wa-send-btn" data-phone="${customer.phone}" data-name="${customer.name}" data-balance="${formatAmount(customer.balance_paise)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                <path d="M12 11V7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 15h.01"/>
              </svg>
              Send Bill
            </button>
            <button class="btn btn-ghost btn-sm pdf-btn" title="Generate Ledger PDF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              PDF
            </button>
          ` : ''}
          <a href="#/customers/${customer.id}/add-transaction" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Entry
          </a>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Running Balance</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${transactions.length === 0 ? `
                <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-3)">No transactions yet. Add an entry to get started.</td></tr>
              ` : transactions.map(tx => {
                const isRev = isReversed(tx, transactions);
                const typeClass = tx.type === 'lent' ? 'badge-lent' : 'badge-repaid';
                const typeLabel = tx.type === 'lent' ? 'Lent' : 'Repaid';
                const isReversalEntry = !!tx.reversed_transaction_id;
                const balClass = tx.balance_after_paise > 0 ? 'text-gold' : tx.balance_after_paise < 0 ? 'text-red' : 'text-muted';
                
                return `
                  <tr style="${isRev ? 'opacity:0.5' : ''}">
                    <td class="col-date">${formatDate(tx.transaction_date)}</td>
                    <td>
                      ${isReversalEntry ? `<span class="badge badge-reversal mr-4">REVERSAL</span>` : ''}
                      <span class="badge ${typeClass}">${typeLabel}</span>
                    </td>
                    <td class="text-right col-amount" style="color:var(--${tx.type === 'lent' ? 'green' : 'red'})">${formatAmount(tx.amount_paise)}</td>
                    <td class="text-right col-balance ${balClass}">${formatAmount(tx.balance_after_paise)}</td>
                    <td class="col-note">${tx.note || '<span class="text-muted">—</span>'}</td>
                    <td class="col-actions">
                      ${!isRev && !isReversalEntry ? `
                        <button class="btn btn-ghost btn-xs reverse-btn" data-tx-id="${tx.id}" title="Reverse this entry">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                          Reverse
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach Reversal Listeners
    root.querySelectorAll('.reverse-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const txId = e.currentTarget.dataset.txId;
        const tx = transactions.find(t => t.id === txId);
        if (!tx) return;

        try {
          const revTx = reverseTransaction(tx);
          const currentBal = await customerStore.getCustomerBalance(customer.id);
          const summary = buildConfirmationSummary(customer, currentBal, revTx);
          
          showConfirmationModal(summary, async () => {
            await customerStore.createTransaction(revTx);
            toast.success('Transaction reversed successfully');
            renderCustomerDetail(root, customerId); // Reload
          });
        } catch (err) {
          toast.error(err.message);
        }
      });
    });

    const deleteBtn = root.querySelector('.delete-customer-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        showDeleteConfirmModal(customer.name, async () => {
          try {
            await customerStore.deleteCustomer(customer.id);
            toast.success(`${customer.name} deleted`);
            window.location.hash = '#/customers';
          } catch (err) {
            toast.error(err.message);
            throw err;
          }
        });
      });
    }

    // Send Bill button — opens WhatsApp
    const waBtn = root.querySelector('.wa-send-btn');
    if (waBtn) {
      waBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const phone = (waBtn.dataset.phone || '').replace(/\D/g, '');
        const name = waBtn.dataset.name || 'Customer';

        if (!phone || phone.length < 10) {
          toast.error('No valid phone number on file');
          return;
        }

        if (!transactions.length) {
          toast.error('No transactions to send');
          return;
        }

        try {
          const latestTx = transactions[0];
          const txAmount = latestTx.amount_paise;
          const prevBalancePaise = latestTx.type === 'lent'
            ? customer.balance_paise - txAmount
            : customer.balance_paise + txAmount;

          const message = generateWhatsAppBill({
            customerName: customer.name,
            amountPaise: latestTx.amount_paise,
            txType: latestTx.type,
            dateTime: latestTx.transaction_date,
            balancePaise: customer.balance_paise,
            transactionId: latestTx.id,
            previousBalancePaise: prevBalancePaise,
          });

          openWhatsAppWithBill(customer.phone, message);
        } catch (err) {
          toast.error('Could not send bill. Check details.');
        }
      });
    }

    // PDF button - generate ledger
    const pdfBtn = root.querySelector('.pdf-btn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        if (!transactions.length) {
          toast.error('No transactions to generate PDF');
          return;
        }
        triggerLedgerDownload(customer, transactions);
      });
    }

  } catch (err) {
    root.innerHTML = `<div class="empty-state"><div class="empty-title">Error</div><div class="empty-body">${err.message}</div><a href="#/customers" class="btn btn-primary mt-16">Back to Customers</a></div>`;
  }
}

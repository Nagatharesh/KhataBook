/**
 * js/pages/addTransaction.js
 */
import { customerStore } from '../store/customerStore.js';
import { validateTransactionInput } from '../lib/validation.js';
import { parseIndianNumberInput, formatIndianNumber } from '../lib/format.js';
import { buildConfirmationSummary } from '../lib/confirmation.js';
import { showConfirmationModal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export async function renderAddTransaction(root, customerId) {
  let customer;
  try {
    customer = await customerStore.getCustomer(customerId);
  } catch (err) {
    toast.error('Customer not found');
    window.location.hash = '#/customers';
    return;
  }

  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);

  root.innerHTML = `
    <div class="page-header mb-24">
      <a href="#/customers/${customerId}" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Cancel
      </a>
      <h2 class="page-title">Add Transaction</h2>
    </div>

    <div class="card card-form">
      <div class="flex items-center gap-12 mb-20 p-12 customer-banner">
        <div class="customer-avatar">${customer.name.charAt(0)}</div>
        <div class="flex-1">
          <div class="fw-600">${customer.name}</div>
          <div class="text-xs text-muted">Current Balance: <strong>${formatIndianNumber(customer.balance_paise)}</strong></div>
        </div>
      </div>

      <form id="tx-form" class="flex-col gap-20">
        
        <div class="form-group">
          <label class="form-label">Transaction Type</label>
          <div class="type-toggle">
            <button type="button" class="type-btn active-lent" data-type="lent">You Lent (Given)</button>
            <button type="button" class="type-btn" data-type="repaid">They Repaid (Received)</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="tx-amount">Amount <span class="required">*</span></label>
          <div class="amount-field">
            <span class="amount-prefix">₹</span>
            <input type="text" id="tx-amount" class="form-input with-prefix" placeholder="0.00" autocomplete="off" required>
          </div>
          <div id="tx-preview" class="amount-preview"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="tx-date">Date & Time <span class="required">*</span></label>
          <input type="datetime-local" id="tx-date" class="form-input" value="${localISOTime}" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="tx-note">Note (Optional)</label>
          <textarea id="tx-note" class="form-textarea" placeholder="What was this for?"></textarea>
        </div>

        <div class="divider mt-8 mb-8"></div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary w-full" id="submit-btn">Review Transaction</button>
        </div>
      </form>
    </div>
  `;

  let currentType = 'lent';
  const typeBtns = root.querySelectorAll('.type-btn');
  const amountInput = document.getElementById('tx-amount');
  const preview = document.getElementById('tx-preview');
  const form = document.getElementById('tx-form');

  // Type toggle
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => {
        b.classList.remove('active-lent', 'active-repaid');
      });
      currentType = btn.dataset.type;
      btn.classList.add(`active-${currentType}`);
      
      // Update primary button color to match type
      const submitBtn = document.getElementById('submit-btn');
      submitBtn.className = `btn w-full ${currentType === 'lent' ? 'btn-success' : 'btn-primary'}`;
    });
  });

  // Amount formatting/parsing as user types
  amountInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (!val) { preview.innerHTML = ''; return; }
    
    const parsed = parseIndianNumberInput(val);
    if (parsed.ok && parsed.paise > 0) {
      preview.textContent = `Valid amount: ${formatIndianNumber(parsed.paise)}`;
      preview.className = 'amount-preview valid';
    } else if (parsed.ok && parsed.paise === 0) {
      preview.textContent = 'Amount must be greater than zero.';
      preview.className = 'amount-preview invalid';
    } else {
      preview.textContent = parsed.error;
      preview.className = 'amount-preview invalid';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rawAmount = amountInput.value;
    const parsed = parseIndianNumberInput(rawAmount);
    
    if (!parsed.ok) {
      toast.error(parsed.error);
      amountInput.focus();
      return;
    }

    const txInput = {
      amount_paise: parsed.paise,
      type: currentType,
      date: new Date(document.getElementById('tx-date').value).toISOString(),
      note: document.getElementById('tx-note').value.trim()
    };

    const v = validateTransactionInput(txInput);
    if (!v.valid) {
      toast.error(v.errors[0]);
      return;
    }

    try {
      const currentBal = await customerStore.getCustomerBalance(customerId);
      const summary = buildConfirmationSummary(customer, currentBal, {
        type: txInput.type,
        amount_paise: txInput.amount_paise,
        date: txInput.date,
        note: txInput.note
      });

      showConfirmationModal(summary, async () => {
        await customerStore.createTransaction({
          customer_id: customerId,
          type: txInput.type,
          amount_paise: txInput.amount_paise,
          transaction_date: txInput.date,
          note: txInput.note,
        });
        toast.success('Transaction added successfully');
        window.location.hash = `#/customers/${customerId}`;
      });

    } catch (err) {
      toast.error(err.message);
    }
  });
}

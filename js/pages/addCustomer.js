/**
 * js/pages/addCustomer.js
 */
import { customerStore } from '../store/customerStore.js';
import { validateCustomerInput, isDuplicatePhone } from '../lib/validation.js';
import { showDeleteConfirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export async function renderAddCustomer(root, customerId = null) {
  const isEdit = !!customerId;
  let customer = null;

  if (isEdit) {
    try {
      customer = await customerStore.getCustomer(customerId);
    } catch (err) {
      toast.error('Customer not found');
      window.location.hash = '#/customers';
      return;
    }
  }

  root.innerHTML = `
    <div class="page-header mb-24">
      <a href="#/customers${isEdit ? `/${customerId}` : ''}" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </a>
      <h2 class="page-title">${isEdit ? 'Edit Customer' : 'New Customer'}</h2>
    </div>

    <div class="card card-form">
      <form id="customer-form" class="flex-col gap-20">
        <div class="form-group">
          <label class="form-label" for="c-name">Full Name <span class="required">*</span></label>
          <input type="text" id="c-name" class="form-input" placeholder="e.g. Ravi Kumar" value="${customer?.name || ''}" required autocomplete="off">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="c-phone">Phone Number</label>
            <input type="tel" id="c-phone" class="form-input" placeholder="10-digit mobile" value="${customer?.phone || ''}" autocomplete="off">
            <div class="form-hint" id="phone-hint"></div>
          </div>
          <div class="form-group">
            <label class="form-label" for="c-email">Email (Optional)</label>
            <input type="email" id="c-email" class="form-input" placeholder="e.g. ravi@email.com" value="${customer?.email || ''}" autocomplete="off">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="c-location">Location / Area</label>
            <input type="text" id="c-location" class="form-input" placeholder="e.g. Avadi" value="${customer?.location || ''}" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="form-label" for="c-district">District <span class="required">*</span></label>
            <input type="text" id="c-district" class="form-input" placeholder="District" value="${customer?.district || 'Thiruvallur'}" required autocomplete="off">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="c-notes">Notes</label>
          <textarea id="c-notes" class="form-textarea" placeholder="Any additional information...">${customer?.notes || ''}</textarea>
        </div>

        <div class="divider mt-8 mb-8"></div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" id="submit-btn">${isEdit ? 'Save Changes' : 'Create Customer'}</button>
          <a href="#/customers${isEdit ? `/${customerId}` : ''}" class="btn btn-ghost">Cancel</a>
          ${isEdit && customer?.transaction_count === 0 ? `
            <button type="button" class="btn btn-danger" id="delete-customer-btn">Delete Customer</button>
          ` : ''}
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('customer-form');
  const phoneInput = document.getElementById('c-phone');
  const phoneHint = document.getElementById('phone-hint');
  const submitBtn = document.getElementById('submit-btn');

  // Duplicate phone check (warn-but-allow)
  let phoneTimeout;
  phoneInput.addEventListener('input', () => {
    clearTimeout(phoneTimeout);
    phoneTimeout = setTimeout(async () => {
      const val = phoneInput.value.trim();
      if (!val) { phoneHint.innerHTML = ''; return; }
      const all = await customerStore.getCustomers();
      // exclude current customer if edit
      const filtered = isEdit ? all.filter(c => c.id !== customerId) : all;
      const dup = isDuplicatePhone(val, filtered);
      if (dup.isDuplicate) {
        phoneHint.innerHTML = `<span style="color:var(--orange)">⚠ Matches existing: ${dup.existingCustomers.map(c=>c.name).join(', ')}</span>`;
      } else {
        phoneHint.innerHTML = '';
      }
    }, 500);
  });

  const deleteBtn = document.getElementById('delete-customer-btn');
  if (deleteBtn && isEdit) {
    deleteBtn.addEventListener('click', () => {
      showDeleteConfirmModal(customer.name, async () => {
        try {
          await customerStore.deleteCustomer(customerId);
          toast.success(`${customer.name} deleted`);
          window.location.hash = '#/customers';
        } catch (err) {
          toast.error(err.message);
          throw err;
        }
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const data = {
      name: document.getElementById('c-name').value,
      phone: document.getElementById('c-phone').value,
      email: document.getElementById('c-email').value,
      location: document.getElementById('c-location').value,
      district: document.getElementById('c-district').value,
      notes: document.getElementById('c-notes').value,
    };

    const v = validateCustomerInput(data);
    if (!v.valid) {
      toast.error(v.errors[0]);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Customer';
      return;
    }

    try {
      if (isEdit) {
        await customerStore.updateCustomer(customerId, v.normalised);
        toast.success('Customer updated successfully');
        window.location.hash = `#/customers/${customerId}`;
      } else {
        const newCust = await customerStore.createCustomer(v.normalised);
        toast.success('Customer created successfully');
        window.location.hash = `#/customers/${newCust.id}`;
      }
    } catch (err) {
      toast.error(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Customer';
    }
  });
}

/**
 * js/pages/customerList.js
 */
import { customerStore } from '../store/customerStore.js';
import { formatAmount } from '../lib/format.js';
import { formatDate } from '../lib/format.js';

let currentQuery = '';
let searchTimeout = null;

export async function renderCustomerList(root) {
  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Customers</h2>
      <a href="#/customers/new" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Customer
      </a>
    </div>

    <div class="mb-20">
      <div class="search-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="customer-search" class="search-input" placeholder="Search by name, phone, location, district..." value="${currentQuery}">
      </div>
    </div>

    <div id="customer-list-container">
      <div class="page-loading"><div class="spinner"></div></div>
    </div>
  `;

  const searchInput = document.getElementById('customer-search');
  const listContainer = document.getElementById('customer-list-container');

  const loadCustomers = async (query) => {
    try {
      const customers = await customerStore.searchCustomers(query);
      if (customers.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">No customers found</div>
            <div class="empty-body">We couldn't find any customers matching "${query}".</div>
            ${query ? `<button class="btn btn-ghost mt-12" id="clear-search-btn">Clear Search</button>` : ''}
          </div>
        `;
        if (query) {
          document.getElementById('clear-search-btn')?.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
          });
        }
        return;
      }

      // Sort by balance (highest first), then by name
      customers.sort((a, b) => {
        if (b.balance_paise !== a.balance_paise) return b.balance_paise - a.balance_paise;
        return a.name.localeCompare(b.name);
      });

      listContainer.innerHTML = `
        <div class="flex-col gap-12">
          ${customers.map(c => `
            <a href="#/customers/${c.id}" class="customer-card">
              <div class="customer-avatar">${c.name.charAt(0)}</div>
              <div class="customer-info">
                <div class="customer-name">${c.name}</div>
                <div class="customer-meta">
                  ${c.phone ? `<span>${c.phone}</span>` : ''}
                  ${c.location ? `<span>${c.location}</span>` : ''}
                  ${c.district ? `<span>${c.district}</span>` : ''}
                  ${c.last_transaction ? `<span>Last active: ${formatDate(c.last_transaction)}</span>` : '<span>No transactions</span>'}
                </div>
              </div>
              <div class="customer-balance">
                <div class="amount ${c.balance_paise > 0 ? 'positive' : c.balance_paise < 0 ? 'negative' : 'zero'}">
                  ${formatAmount(c.balance_paise)}
                </div>
                <div class="label">${c.balance_paise > 0 ? 'Owes you' : c.balance_paise < 0 ? 'You owe' : 'Settled'}</div>
              </div>
            </a>
          `).join('')}
        </div>
      `;
    } catch (err) {
      listContainer.innerHTML = `<div class="warning-box">Error loading customers: ${err.message}</div>`;
    }
  };

  await loadCustomers(currentQuery);

  searchInput.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadCustomers(currentQuery);
    }, 300);
  });
}

/**
 * js/components/modal.js — Confirmation modal
 * Used before every transaction write. No DB write happens without this.
 */

import { formatDate } from '../lib/format.js';

function getBackdrop() {
  return document.getElementById('modal-backdrop');
}

function getFrame() {
  return document.getElementById('modal-frame');
}

function close() {
  const backdrop = getBackdrop();
  const frame = getFrame();
  if (backdrop) backdrop.classList.remove('visible');
  if (frame) {
    frame.classList.remove('visible');
    setTimeout(() => { frame.innerHTML = ''; }, 350);
  }
  document.body.classList.remove('modal-open');
}

/**
 * showConfirmationModal(summary, onConfirm)
 *
 * @param {import('../lib/confirmation.js').ConfirmationSummary} summary
 * @param {() => Promise<void>} onConfirm
 */
export function showConfirmationModal(summary, onConfirm) {
  const typeLabel   = summary.type === 'lent' ? 'Lent' : 'Repaid';
  const typeClass   = summary.type === 'lent' ? 'badge-lent' : 'badge-repaid';
  const afterClass  = summary.balanceAfter_paise > 0 ? 'positive'
                    : summary.balanceAfter_paise < 0 ? 'negative' : 'zero';
  
  const frame = getFrame();
  const backdrop = getBackdrop();

  frame.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="modal-title">Confirm Transaction</h2>
      <button class="modal-close" id="modal-close-btn" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="modal-body">
      <div class="confirm-row">
        <span class="label">Customer</span>
        <span class="value">${escapeHtml(summary.customerName)}${summary.customerPhone ? ` · ${escapeHtml(summary.customerPhone)}` : ''}</span>
      </div>
      <div class="confirm-row">
        <span class="label">Type</span>
        <span class="value"><span class="badge ${typeClass}">${typeLabel}</span></span>
      </div>
      <div class="confirm-row">
        <span class="label">Amount</span>
        <span class="value" style="font-family:'Outfit',sans-serif;font-size:16px;color:var(--${summary.type === 'lent' ? 'green' : 'red'})">${summary.amountFormatted}</span>
      </div>
      <div class="confirm-row">
        <span class="label">Date</span>
        <span class="value">${formatDate(summary.date)}</span>
      </div>
      ${summary.note ? `<div class="confirm-row"><span class="label">Note</span><span class="value" style="color:var(--text-2)">${escapeHtml(summary.note)}</span></div>` : ''}

      <div class="confirm-balance-arrow" style="margin-top:16px">
        <span class="arrow-before">${summary.balanceBeforeFormatted}</span>
        <span class="arrow-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
        <span class="arrow-after ${afterClass}">${summary.balanceAfterFormatted}</span>
        <span style="font-size:12px;color:var(--text-3);margin-left:auto">${summary.balanceAfterLabel}</span>
      </div>

      ${summary.warningMessage ? `
        <div class="warning-box">
          <svg width="18" height="18" style="flex-shrink:0;margin-top:1px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>${escapeHtml(summary.warningMessage)}</span>
        </div>` : ''}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
      <button class="btn ${summary.isOverpayment ? 'btn-danger' : summary.type === 'lent' ? 'btn-success' : 'btn-primary'}" id="modal-confirm-btn">
        ${summary.isOverpayment ? '⚠ Confirm Anyway' : `Confirm ${typeLabel}`}
      </button>
    </div>
  `;

  backdrop.classList.add('visible');
  frame.classList.add('visible');
  frame.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  let confirmed = false;

  frame.querySelector('#modal-close-btn').addEventListener('click', close);
  frame.querySelector('#modal-cancel-btn').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  frame.querySelector('#modal-confirm-btn').addEventListener('click', async () => {
    if (confirmed) return;
    confirmed = true;
    const confirmBtn = frame.querySelector('#modal-confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Saving…';
    try {
      await onConfirm();
      close();
    } catch (err) {
      confirmBtn.disabled  = false;
      confirmBtn.textContent = summary.isOverpayment ? '⚠ Confirm Anyway' : `Confirm ${typeLabel}`;
      confirmed = false;
      throw err;
    }
  });
}

/**
 * escapeHtml(str) - Prevents XSS in error messages and modal content
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Export modal (for export button) ─────────────────────────────────────────
function getExpBackdrop() {
  return document.getElementById('export-backdrop');
}

function getExpFrame() {
  return document.getElementById('export-frame');
}

function closeExport() {
  const expBackdrop = getExpBackdrop();
  const expFrame = getExpFrame();
  if (expBackdrop) expBackdrop.classList.remove('visible');
  if (expFrame) {
    expFrame.classList.remove('visible');
    setTimeout(() => { expFrame.innerHTML = ''; }, 350);
  }
  document.body.classList.remove('modal-open');
}

export function showExportModal(onExport) {
  const expBackdrop = getExpBackdrop();
  const expFrame = getExpFrame();
  
  expFrame.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="export-title">Export Data</h2>
      <button class="modal-close" id="exp-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="font-size:14px;color:var(--text-2);margin-bottom:20px;line-height:1.6">
        Export a complete, restorable snapshot of all customers and transactions.
        Choose your preferred format below.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-ghost w-full" style="justify-content:flex-start;gap:12px" data-fmt="sql">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <span><strong>SQL</strong> <span style="color:var(--text-3)">— INSERT statements, fully restorable to a fresh schema</span></span>
        </button>
        <button class="btn btn-ghost w-full" style="justify-content:flex-start;gap:12px" data-fmt="csv">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span><strong>CSV</strong> <span style="color:var(--text-3)">— Two files (customers + transactions), opens in Excel</span></span>
        </button>
        <button class="btn btn-ghost w-full" style="justify-content:flex-start;gap:12px" data-fmt="json">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <span><strong>JSON</strong> <span style="color:var(--text-3)">— Complete structured snapshot with all fields</span></span>
        </button>
      </div>
    </div>
  `;

  expBackdrop.classList.add('visible');
  expFrame.classList.add('visible');
  expFrame.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  expFrame.querySelector('#exp-close').addEventListener('click', closeExport);
  expBackdrop.addEventListener('click', closeExport);

  expFrame.querySelectorAll('[data-fmt]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Downloading…';
      await onExport(btn.dataset.fmt);
      closeExport();
    });
  });
}

/**
 * showDeleteConfirmModal(customerName, onConfirm)
 * Confirms permanent customer deletion (only allowed when no transactions exist).
 */
export function showDeleteConfirmModal(customerName, onConfirm) {
  const frame = getFrame();
  const backdrop = getBackdrop();
  
  frame.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="modal-title">Delete Customer</h2>
      <button class="modal-close" id="modal-close-btn" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="modal-body">
      <p style="font-size:14px;color:var(--text-2);line-height:1.6;margin:0">
        Are you sure you want to permanently delete <strong>${escapeHtml(customerName)}</strong>?
        This cannot be undone.
      </p>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-danger" id="modal-confirm-btn">Delete Customer</button>
    </div>
  `;

  backdrop.classList.add('visible');
  frame.classList.add('visible');
  frame.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  let confirmed = false;

  frame.querySelector('#modal-close-btn').addEventListener('click', close);
  frame.querySelector('#modal-cancel-btn').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  frame.querySelector('#modal-confirm-btn').addEventListener('click', async () => {
    if (confirmed) return;
    confirmed = true;
    const confirmBtn = frame.querySelector('#modal-confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting…';
    try {
      await onConfirm();
      close();
    } catch (err) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Customer';
      confirmed = false;
      throw err;
    }
  });
}



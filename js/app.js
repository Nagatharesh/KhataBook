/**
 * js/app.js — Router & App Entry Point
 */

import { renderDashboard } from './pages/dashboard.js';
import { renderCustomerList } from './pages/customerList.js';
import { renderCustomerDetail } from './pages/customerDetail.js';
import { renderAddCustomer } from './pages/addCustomer.js';
import { renderAddTransaction } from './pages/addTransaction.js';
import { renderLogin } from './pages/login.js';
import { showExportModal } from './components/modal.js';
import { triggerExport } from './utils/export.js';
import { toast } from './components/toast.js';
import { supabaseClient } from './lib/supabase.js';
import { customerStore } from './store/customerStore.js';

const root = document.getElementById('page-root');
const topbarTitle = document.getElementById('topbar-title');
const navLinks = document.querySelectorAll('.nav-link');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const overlay = document.getElementById('sidebar-overlay');

let currentUser = null;
let appInitialized = false;
let walletReady = false;

async function loadCurrentWallet() {
  if (!currentUser) return false;

  try {
    await customerStore.ensureDefaultWallet();
    walletReady = true;
    return true;
  } catch (err) {
    walletReady = false;
    console.error('Wallet initialization error:', err);
    toast.error('Unable to load wallet: ' + err.message);
    return false;
  }
}

// Listen to auth changes — MUST NOT await Supabase auth methods inside this callback
// (doing so causes a deadlock on the internal auth lock)
supabaseClient.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;
  walletReady = false; // Reset wallet on auth change
  updateAuthUI();

  // Use setTimeout(0) to escape the auth callback lock before making Supabase queries
  setTimeout(async () => {
    await loadCurrentWallet();
    if (!appInitialized) {
      appInitialized = true;
      window.addEventListener('hashchange', router);
    }
    router();
  }, 0);
});

function updateAuthUI() {
  const userBlock = document.getElementById('sidebar-user-block');
  const userEmail = document.getElementById('sidebar-user-email');
  
  if (currentUser) {
    document.body.classList.remove('logged-out');
    document.body.classList.add('logged-in');
    if (userBlock) userBlock.style.display = 'block';
    if (userEmail) userEmail.textContent = currentUser.email;
  } else {
    document.body.classList.remove('logged-in');
    document.body.classList.add('logged-out');
    if (userBlock) userBlock.style.display = 'none';
  }
}

// ── Routing ──────────────────────────────────────────────────────────────────
async function router() {
  let hash = window.location.hash.slice(1) || '/dashboard';
  if (hash === '/') hash = '/dashboard';
  
  // Guard routes based on auth status
  if (!currentUser) {
    if (hash !== '/login') {
      window.location.hash = '#/login';
      return;
    }
  } else {
    if (hash === '/login') {
      window.location.hash = '#/dashboard';
      return;
    }
  }

  root.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;
  
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  document.body.classList.remove('sidebar-open');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (hash.startsWith(link.getAttribute('href').slice(1))) {
      link.classList.add('active');
    }
  });

  try {
    if (hash === '/login') {
      topbarTitle.textContent = 'Authentication';
      renderLogin(root);
    }
    else if (hash === '/dashboard') {
      topbarTitle.textContent = 'Overview';
      await renderDashboard(root);
    } 
    else if (hash === '/customers') {
      topbarTitle.textContent = 'Customers';
      await renderCustomerList(root);
    } 
    else if (hash === '/customers/new') {
      topbarTitle.textContent = 'Add Customer';
      await renderAddCustomer(root);
    } 
    else if (hash.match(/^\/customers\/([^\/]+)\/edit$/)) {
      topbarTitle.textContent = 'Edit Customer';
      const id = hash.match(/^\/customers\/([^\/]+)\/edit$/)[1];
      await renderAddCustomer(root, id);
    } 
    else if (hash.match(/^\/customers\/([^\/]+)\/add-transaction$/)) {
      topbarTitle.textContent = 'Add Transaction';
      const id = hash.match(/^\/customers\/([^\/]+)\/add-transaction$/)[1];
      await renderAddTransaction(root, id);
    } 
    else if (hash.match(/^\/customers\/([^\/]+)$/)) {
      topbarTitle.textContent = 'Customer Profile';
      const id = hash.match(/^\/customers\/([^\/]+)$/)[1];
      await renderCustomerDetail(root, id);
    }
    else {
      root.innerHTML = `<div class="empty-state"><div class="empty-title">404</div><div class="empty-body">Page not found</div><a href="#/dashboard" class="btn btn-primary mt-16">Go Dashboard</a></div>`;
    }
    
    // Animate page entry
    if (root.firstElementChild) {
      root.firstElementChild.classList.add('page-enter');
    }
    
  } catch (err) {
    console.error(err);
    const safeMessage = String(err.message).replace(/</g, '<').replace(/>/g, '>');
    root.innerHTML = `<div class="warning-box" style="margin:20px">Error loading page: ${safeMessage}</div>`;
  }
}

// ── Global Listeners ─────────────────────────────────────────────────────────

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
  sidebar.classList.add('open');
  overlay.classList.add('visible');
  document.body.classList.add('sidebar-open');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  document.body.classList.remove('sidebar-open');
});

// Export button
document.getElementById('export-btn').addEventListener('click', () => {
  showExportModal(async (format) => {
    try {
      await triggerExport(format);
      toast.success(`${format.toUpperCase()} export downloaded`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  });
});

// Sign Out button action
const signoutBtn = document.getElementById('signout-btn');
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (err) {
      toast.error('Error signing out: ' + err.message);
    }
  });
}

// Initialize — check existing session without entering the auth callback lock
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session?.user || null;
  updateAuthUI();

  // Wallet loading and router should happen via onAuthStateChange callback
  // (which fires after getSession resolves). We set initialized flag to
  // prevent the IIFE from racing with the callback.
  if (!appInitialized) {
    appInitialized = true;
    window.addEventListener('hashchange', router);
    
    // If there's no session, the callback won't fire, so we need to trigger router manually
    if (!currentUser) {
      router();
    }
  }
})();
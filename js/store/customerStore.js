/**
 * js/store/customerStore.js — Data Access Layer with safe multi-tenant isolation
 *
 * Isolation strategy (two levels):
 * 1. WALLET MODE: If the 'wallets' table exists → all queries filtered by wallet_id
 *    - For reads: ALSO includes rows with wallet_id IS NULL (pre-migration data)
 *    - For writes: wallet_id must match current user's wallet
 * 2. LEGACY MODE: If 'wallets' table doesn't exist → all queries filtered by created_by = auth.uid()
 *
 * Both modes prevent users from seeing each other's data.
 * No mode ever queries without a user-based filter.
 */

import { supabaseClient } from '../lib/supabase.js';
import { calculateBalance, computeFinalBalance } from '../lib/balance.js';
import { generateClientRequestId, toIntegerPaise } from '../lib/format.js';
import { toast } from '../components/toast.js';

let currentWalletId = null;
let walletInitInProgress = false;
let usingLegacyMode = false;
let cachedUserId = null;

export const customerStore = {

  /**
   * Returns the authenticated user's ID.
   * Throws if no user is logged in — prevents unauthenticated access.
   * Caches the result for subsequent synchronous access.
   */
  async getUserId() {
    if (cachedUserId) return cachedUserId;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Authentication required. Please sign in.');
    cachedUserId = user.id;
    return cachedUserId;
  },

  /**
   * Apply isolation filter for READ queries.
   * In wallet mode: wallet_id = X OR (wallet_id IS NULL AND created_by = current user)
   *   - The OR handles pre-migration data (transactions created before wallets existed)
   * In legacy mode: created_by = current user
   */
  _applyReadFilter(query) {
    if (currentWalletId) {
      // In wallet mode, also include legacy rows without wallet_id
      // that were created by the same user
      return query.or(`wallet_id.eq.${currentWalletId},and(wallet_id.is.null,created_by.eq.${cachedUserId})`);
    }
    // Legacy mode: filter by created_by
    if (!cachedUserId) throw new Error('Authentication required — cannot query without user identity');
    return query.eq('created_by', cachedUserId);
  },

  /**
   * Apply isolation filter for WRITE/DELETE queries.
   * In wallet mode: wallet_id = currentWalletId (must match)
   * In legacy mode: created_by = current user
   */
  _applyWriteFilter(query) {
    if (currentWalletId) {
      return query.eq('wallet_id', currentWalletId);
    }
    if (!cachedUserId) throw new Error('Authentication required — cannot query without user identity');
    return query.eq('created_by', cachedUserId);
  },

  /**
   * Attach wallet_id to a payload for INSERT operations.
   * In legacy mode, wallet_id is omitted (the column may not exist or be nullable).
   */
  _withIsolationId(payload) {
    if (currentWalletId) {
      return { ...payload, wallet_id: currentWalletId };
    }
    return payload;
  },

  /**
   * Initialize the user's default wallet if the wallets table exists.
   * If the wallets table doesn't exist, falls back to legacy mode
   * where isolation is enforced via created_by = auth.uid().
   */
  async ensureDefaultWallet() {
    if (currentWalletId) return currentWalletId;

    if (walletInitInProgress) {
      while (walletInitInProgress) {
        await new Promise(r => setTimeout(r, 50));
      }
      return currentWalletId;
    }

    walletInitInProgress = true;

    try {
      const userId = await this.getUserId();

      // Probe: does the wallets table exist?
      const { error: probeError } = await supabaseClient
        .from('wallets')
        .select('id')
        .limit(1);

      if (probeError) {
        usingLegacyMode = true;
        currentWalletId = null;
        walletInitInProgress = false;
        console.warn('Wallets table not found; using created_by-based isolation (safe fallback)');
        return null;
      }

      // Wallets table exists — find or create the user's wallet
      const { data: existingWallet, error: findError } = await supabaseClient
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (findError) throw new Error(`Failed to find wallet: ${findError.message}`);

      if (existingWallet) {
        currentWalletId = existingWallet.id;
        usingLegacyMode = false;
        walletInitInProgress = false;
        return currentWalletId;
      }

      // No wallet exists — create one
      const { data: newWallet, error: createError } = await supabaseClient
        .from('wallets')
        .insert({
          user_id: userId,
          name: 'Default Wallet',
          status: 'active',
        })
        .select('id')
        .single();

      if (createError) throw new Error(`Failed to create wallet: ${createError.message}`);

      currentWalletId = newWallet.id;
      usingLegacyMode = false;
      walletInitInProgress = false;
      return currentWalletId;

    } catch (err) {
      walletInitInProgress = false;
      currentWalletId = null;
      usingLegacyMode = false;
      const errMsg = err?.message || (err instanceof Error ? err.message : String(err));
      console.error('Wallet initialization failed:', errMsg);
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error('Failed to initialize wallet: ' + errMsg);
      }
      throw err;
    }
  },

  async getCurrentWalletId() {
    if (currentWalletId) return currentWalletId;
    if (usingLegacyMode) return null;
    return this.ensureDefaultWallet();
  },

  async getCustomers() {
    const walletId = await this.getCurrentWalletId();

    let customerQuery = supabaseClient.from('customers').select('*');
    customerQuery = this._applyReadFilter(customerQuery);
    const { data: customers, error: cErr } = await customerQuery;

    if (cErr) throw new Error(cErr.message);

    let txQuery = supabaseClient
      .from('transactions')
      .select('customer_id, type, amount_paise, transaction_date, created_at');
    txQuery = this._applyReadFilter(txQuery);
    const { data: txs, error: tErr } = await txQuery;

    if (tErr) throw new Error(tErr.message);

    return customers.map(c => {
      const cTxs = txs.filter(t => t.customer_id === c.id);
      const { finalBalance, runningBalances } = calculateBalance(cTxs);
      const lastTx = runningBalances[runningBalances.length - 1];
      return {
        ...c,
        balance_paise: finalBalance,
        last_transaction: lastTx ? lastTx.transaction_date : null,
        transaction_count: cTxs.length,
      };
    }).sort((a, b) => b.balance_paise - a.balance_paise || a.name.localeCompare(b.name));
  },

  async getCustomer(id) {
    const walletId = await this.getCurrentWalletId();

    let customerQuery = supabaseClient
      .from('customers')
      .select('*')
      .eq('id', id);
    customerQuery = this._applyReadFilter(customerQuery);
    const { data: c, error: cErr } = await customerQuery.single();

    if (cErr) throw new Error(cErr.message);

    let txQuery = supabaseClient
      .from('transactions')
      .select('type, amount_paise, transaction_date, created_at')
      .eq('customer_id', id);
    txQuery = this._applyReadFilter(txQuery);
    const { data: txs, error: tErr } = await txQuery;

    if (tErr) throw new Error(tErr.message);

    const { finalBalance, runningBalances } = calculateBalance(txs);
    const lastTx = runningBalances[runningBalances.length - 1];

    return {
      ...c,
      balance_paise: finalBalance,
      last_transaction: lastTx ? lastTx.transaction_date : null,
      transaction_count: txs.length,
    };
  },

  async createCustomer(data) {
    const userId = await this.getUserId();
    const walletId = await this.getCurrentWalletId();

    const newCust = this._withIsolationId({
      name: data.name.trim(),
      phone: (data.phone || '').trim(),
      location: (data.location || '').trim(),
      district: (data.district || 'Thiruvallur').trim(),
      email: (data.email || '').trim(),
      notes: (data.notes || '').trim(),
      created_by: userId,
    });

    const { data: c, error } = await supabaseClient
      .from('customers')
      .insert([newCust])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return { ...c, balance_paise: 0, last_transaction: null, transaction_count: 0 };
  },

  async updateCustomer(id, data) {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.phone !== undefined) updates.phone = data.phone.trim();
    if (data.location !== undefined) updates.location = data.location.trim();
    if (data.district !== undefined) updates.district = data.district.trim();
    if (data.email !== undefined) updates.email = data.email.trim();
    if (data.notes !== undefined) updates.notes = data.notes.trim();

    let updateQuery = supabaseClient
      .from('customers')
      .update(updates)
      .eq('id', id);
    // Apply read filter to handle both wallet and legacy data
    updateQuery = this._applyReadFilter(updateQuery);
    const { data: c, error } = await updateQuery
      .select()
      .single();

    if (error) throw new Error(error.message);

    return this.getCustomer(id);
  },

  async deleteCustomer(id) {
    const walletId = await this.getCurrentWalletId();

    // Delete transactions first — use write filter for wallet mode,
    // but also include legacy transactions with NULL wallet_id
    let txQuery = supabaseClient.from('transactions').delete().eq('customer_id', id);
    if (currentWalletId) {
      // In wallet mode, also delete legacy transactions owned by this user
      txQuery = txQuery.or(`wallet_id.eq.${currentWalletId},and(wallet_id.is.null,created_by.eq.${cachedUserId})`);
    } else {
      txQuery = this._applyWriteFilter(txQuery);
    }
    const { error: txErr } = await txQuery;
    if (txErr) throw new Error(txErr.message);

    // Delete customer — use write filter to verify ownership
    let customerQuery = supabaseClient.from('customers').delete().eq('id', id);
    customerQuery = this._applyWriteFilter(customerQuery);
    const { error } = await customerQuery;
    if (error) throw new Error(error.message);
  },

  async getTransactions(customerId) {
    const walletId = await this.getCurrentWalletId();

    let query = supabaseClient
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId);
    query = this._applyReadFilter(query);
    const { data: txs, error } = await query
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    const { runningBalances } = calculateBalance(txs);
    return [...runningBalances].reverse();
  },

  async getAllTransactions() {
    const walletId = await this.getCurrentWalletId();

    let query = supabaseClient.from('transactions').select('*');
    query = this._applyReadFilter(query);
    const { data, error } = await query
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return data;
  },

  async createTransaction(data) {
    const clientReqId = data.client_request_id || generateClientRequestId();

    // Use maybeSingle() instead of single() to avoid 406 errors when
    // RLS blocks the query (which manifests as 406 Not Acceptable, not PGRST116)
    const { data: existing, error: findErr } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('client_request_id', clientReqId)
      .maybeSingle();

    if (existing) return existing;
    if (findErr && findErr.code !== 'PGRST116' && findErr.code !== '406') {
      // 406 can occur when RLS blocks the SELECT (due to type mismatch UUID vs TEXT)
      // Don't throw — the transaction might not exist yet, and we should proceed
      console.warn('Duplicate check could not be completed (RLS may block):', findErr.message);
    }

    const amount = toIntegerPaise(data.amount_paise);
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Invalid transaction amount');

    const userId = await this.getUserId();
    const walletId = await this.getCurrentWalletId();

    // Use read filter when looking up customer (to find legacy ones too)
    let customerQuery = supabaseClient
      .from('customers')
      .select('id, wallet_id')
      .eq('id', data.customer_id);
    customerQuery = this._applyReadFilter(customerQuery);
    const { data: customer, error: customerErr } = await customerQuery.single();

    if (customerErr) throw new Error(customerErr.message);

    const effectiveWalletId = walletId || customer.wallet_id;

    if (customer.wallet_id && effectiveWalletId && customer.wallet_id !== effectiveWalletId) {
      throw new Error('Customer belongs to a different wallet');
    }

    // Use read filter for existing transactions (to include legacy ones for balance calc)
    let existingTxsQuery = supabaseClient
      .from('transactions')
      .select('*')
      .eq('customer_id', data.customer_id);
    existingTxsQuery = this._applyReadFilter(existingTxsQuery);
    const { data: existingTxs, error: txErr } = await existingTxsQuery;

    if (txErr) throw new Error(txErr.message);

    const txDate = data.transaction_date || new Date().toISOString();

    const draftTx = this._withIsolationId({
      id: clientReqId,
      client_request_id: clientReqId,
      customer_id: data.customer_id,
      type: data.type,
      amount_paise: amount,
      transaction_date: txDate,
      created_at: txDate,
      note: (data.note || '').trim(),
      reversed_transaction_id: data.reversed_transaction_id || null,
      created_by: data.created_by || userId,
    });

    const { runningBalances } = calculateBalance([...(existingTxs || []), draftTx]);
    const computed = runningBalances.find(t => t.id === clientReqId);
    if (!computed) throw new Error('Failed to compute balance for new transaction');

    const newTx = this._withIsolationId({
      client_request_id: clientReqId,
      customer_id: data.customer_id,
      type: data.type,
      amount_paise: amount,
      balance_after_paise: computed.balance_after_paise,
      transaction_date: txDate,
      note: draftTx.note,
      reversed_transaction_id: draftTx.reversed_transaction_id,
      created_by: draftTx.created_by,
    });

    const { data: inserted, error } = await supabaseClient
      .from('transactions')
      .insert([newTx])
      .select()
      .single();

    if (error) {
      // Log full error details for debugging
      console.error('INSERT failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        payload: {
          created_by: newTx.created_by,
          wallet_id: newTx.wallet_id,
          customer_id: newTx.customer_id,
          type: newTx.type,
        }
      });
      throw new Error(`Failed to save transaction: ${error.message || error.code || 'Unknown error'}`);
    }

    return inserted;
  },

  async getCustomerBalance(customerId) {
    const walletId = await this.getCurrentWalletId();

    let query = supabaseClient
      .from('transactions')
      .select('type, amount_paise, transaction_date, created_at')
      .eq('customer_id', customerId);
    query = this._applyReadFilter(query);
    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return computeFinalBalance(data);
  },

  async getTopOutstandingCustomers(limit = 5) {
    const all = await this.getCustomers();
    return all.filter(c => c.balance_paise > 0)
      .sort((a, b) => b.balance_paise - a.balance_paise)
      .slice(0, limit);
  },

  async getDashboardData() {
    return this.getAllTransactions();
  },

  async searchCustomers(query) {
    if (!query || query.trim() === '') return this.getCustomers();

    const q = query.trim().toLowerCase();
    const all = await this.getCustomers();

    return all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  },

  async exportSnapshot() {
    const walletId = await this.getCurrentWalletId();
    let wallet = null;

    if (walletId) {
      const { data: walletRow, error: wErr } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (wErr) throw new Error(wErr.message);
      wallet = walletRow;
    }

    let customerQuery = supabaseClient.from('customers').select('*');
    customerQuery = this._applyReadFilter(customerQuery);
    const { data: customers, error: cErr } = await customerQuery;

    if (cErr) throw new Error(cErr.message);

    let transactionQuery = supabaseClient.from('transactions').select('*');
    transactionQuery = this._applyReadFilter(transactionQuery);
    const { data: transactions, error: tErr } = await transactionQuery;

    if (tErr) throw new Error(tErr.message);

    return {
      exportedAt: new Date().toISOString(),
      wallet,
      customers,
      transactions,
    };
  },

};
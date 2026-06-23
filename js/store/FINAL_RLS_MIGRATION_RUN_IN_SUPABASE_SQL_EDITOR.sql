-- ============================================================
-- FINAL RLS MIGRATION — Run this in your Supabase SQL Editor
-- Enforces wallet-based multi-tenant isolation
-- Every user ONLY sees their own data via their wallet
--
-- IMPORTANT: Uses auth.uid()::text for comparisons because
-- created_by and user_id columns may be TEXT type (not UUID)
-- in existing tables.
-- ============================================================

-- 1. Create wallets table (if not exists)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default Wallet',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ensure wallet_id columns exist on customers and transactions
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- 3. Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "wallets_select" ON wallets;
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
DROP POLICY IF EXISTS "wallets_update" ON wallets;
DROP POLICY IF EXISTS "wallets_delete" ON wallets;
DROP POLICY IF EXISTS "wallets_select_final" ON wallets;
DROP POLICY IF EXISTS "wallets_insert_final" ON wallets;
DROP POLICY IF EXISTS "wallets_update_final" ON wallets;
DROP POLICY IF EXISTS "wallets_delete_final" ON wallets;

DROP POLICY IF EXISTS "users_view_own_customers" ON customers;
DROP POLICY IF EXISTS "users_insert_own_customers" ON customers;
DROP POLICY IF EXISTS "users_update_own_customers" ON customers;
DROP POLICY IF EXISTS "users_delete_own_customers" ON customers;
DROP POLICY IF EXISTS "customers_select_wallet_or_legacy" ON customers;
DROP POLICY IF EXISTS "customers_insert_wallet_required" ON customers;
DROP POLICY IF EXISTS "customers_update_wallet_or_legacy" ON customers;
DROP POLICY IF EXISTS "customers_delete_wallet_or_legacy" ON customers;
DROP POLICY IF EXISTS "customers_select_wallet_final" ON customers;
DROP POLICY IF EXISTS "customers_insert_wallet_final" ON customers;
DROP POLICY IF EXISTS "customers_update_wallet_final" ON customers;
DROP POLICY IF EXISTS "customers_delete_wallet_final" ON customers;

DROP POLICY IF EXISTS "users_view_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_insert_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_update_own_transactions" ON transactions;
DROP POLICY IF EXISTS "transactions_select_wallet_or_legacy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_wallet_required" ON transactions;
DROP POLICY IF EXISTS "transactions_update_wallet_or_legacy" ON transactions;
DROP POLICY IF EXISTS "transactions_select_wallet_final" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_wallet_final" ON transactions;
DROP POLICY IF EXISTS "transactions_update_wallet_final" ON transactions;

-- 5. WALLET POLICIES — user can only see/edit their own wallets
-- Note: auth.uid()::text because user_id is TEXT type
CREATE POLICY "wallets_select" ON wallets FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "wallets_insert" ON wallets FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "wallets_update" ON wallets FOR UPDATE
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "wallets_delete" ON wallets FOR DELETE
    USING (user_id = auth.uid()::text);

-- 6. CUSTOMER POLICIES — user can only see customers in their wallets
CREATE POLICY "customers_select" ON customers FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
    );

CREATE POLICY "customers_insert" ON customers FOR INSERT
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
        AND created_by = auth.uid()::text
    );

CREATE POLICY "customers_update" ON customers FOR UPDATE
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
    )
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
        AND created_by = auth.uid()::text
    );

CREATE POLICY "customers_delete" ON customers FOR DELETE
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
    );

-- 7. TRANSACTION POLICIES — user can only see transactions in their wallets
CREATE POLICY "transactions_select" ON transactions FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
    );

CREATE POLICY "transactions_insert" ON transactions FOR INSERT
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
        AND created_by = auth.uid()::text
        AND customer_id IN (
            SELECT id FROM customers
            WHERE wallet_id IN (
                SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
            )
        )
    );

CREATE POLICY "transactions_update" ON transactions FOR UPDATE
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
    )
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()::text AND status = 'active'
        )
        AND created_by = auth.uid()::text
    );

-- 8. Verify the policies are applied
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
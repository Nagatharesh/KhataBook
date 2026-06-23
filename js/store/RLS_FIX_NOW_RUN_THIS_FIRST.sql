-- ============================================================
-- FIX RLS 403/406/409 ERRORS — Run this NOW in Supabase SQL Editor
-- ============================================================
-- All errors have ONE root cause: existing RLS policies compare
-- auth.uid() (UUID type) to created_by (TEXT type).
-- PostgreSQL rejects this comparison → operations fail.
--
-- Also missing: DELETE policy for transactions (causes 409 on customer delete)
--
-- Fix: DROP all broken policies, recreate with auth.uid()::text cast,
-- and add the missing DELETE policy for transactions.
-- ============================================================

-- 1. Drop ALL existing broken policies
DROP POLICY IF EXISTS "users_view_own_customers" ON customers;
DROP POLICY IF EXISTS "users_insert_own_customers" ON customers;
DROP POLICY IF EXISTS "users_update_own_customers" ON customers;
DROP POLICY IF EXISTS "users_delete_own_customers" ON customers;

DROP POLICY IF EXISTS "users_view_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_insert_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_update_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_delete_own_transactions" ON transactions;

-- 2. Recreate customer policies with ::text cast
--    (also covers UPDATE which needs USING clause)
CREATE POLICY "users_view_own_customers" ON customers FOR SELECT
    USING (created_by = auth.uid()::text);

CREATE POLICY "users_insert_own_customers" ON customers FOR INSERT
    WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "users_update_own_customers" ON customers FOR UPDATE
    USING (created_by = auth.uid()::text);

CREATE POLICY "users_delete_own_customers" ON customers FOR DELETE
    USING (created_by = auth.uid()::text);

-- 3. Recreate transaction policies with ::text cast
--    SELECT uses OR to allow seeing transactions of own customers
CREATE POLICY "users_view_own_transactions" ON transactions FOR SELECT
    USING (
        created_by = auth.uid()::text
        OR customer_id IN (
            SELECT id FROM customers WHERE created_by = auth.uid()::text
        )
    );

CREATE POLICY "users_insert_own_transactions" ON transactions FOR INSERT
    WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "users_update_own_transactions" ON transactions FOR UPDATE
    USING (created_by = auth.uid()::text);

-- ⭐ FIX: ADD THE MISSING DELETE POLICY for transactions
-- Without this, deleting a customer fails because transaction DELETE is denied by RLS
CREATE POLICY "users_delete_own_transactions" ON transactions FOR DELETE
    USING (created_by = auth.uid()::text);

-- 4. Verify all 11 policies exist
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
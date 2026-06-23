-- Multi-Tenant RLS Schema for KhataBook
-- Apply these migrations to enable tenant isolation and account deletion

-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;



-- RLS Policies for customers table
-- Users can only view their own customers
CREATE POLICY "users_view_own_customers"
ON customers FOR SELECT
USING (auth.uid() = created_by);

-- Users can only insert customers they own
CREATE POLICY "users_insert_own_customers"
ON customers FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can only update their own customers
CREATE POLICY "users_update_own_customers"
ON customers FOR UPDATE
USING (auth.uid() = created_by);

-- Users can only delete their own customers (handled by account deletion)
CREATE POLICY "users_delete_own_customers"
ON customers FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for transactions table
-- Users can view transactions for their customers
CREATE POLICY "users_view_own_transactions"
ON transactions FOR SELECT
USING (auth.uid() = created_by 
  OR customer_id IN (SELECT id FROM customers WHERE created_by = auth.uid()));

-- Users can insert transactions for their customers
CREATE POLICY "users_insert_own_transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their own transactions (limited use in reversal)
CREATE POLICY "users_update_own_transactions"
ON transactions FOR UPDATE
USING (auth.uid() = created_by);



-- Add trigger for updated_at timestamp (if using soft deletes)
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verification query - run after migration to verify RLS is working
-- SELECT * FROM customers; -- Should only return current user's customers
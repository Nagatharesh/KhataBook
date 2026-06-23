/**
 * js/store/mockData.js
 * Realistic Indian lending-notebook sample data for Phase 2.
 * All amounts stored as integer paise (100 paise = ₹1).
 */

export const mockOwner = {
  id: 'owner-1',
  name: 'Business Owner',
  email: 'owner@khatabook.local',
};

export const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Ravi Kumar',
    phone: '9876543210',
    location: 'Avadi',
    district: 'Thiruvallur',
    email: '',
    notes: 'Construction materials supplier',
    created_at: '2025-09-10T08:00:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-002',
    name: 'Priya Sundaram',
    phone: '8765432109',
    location: 'Ponneri Road',
    district: 'Thiruvallur',
    email: 'priya.s@gmail.com',
    notes: 'Regular customer — school teacher',
    created_at: '2025-10-01T09:30:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-003',
    name: 'Murugan Selvam',
    phone: '7654321098',
    location: 'Gummidipoondi',
    district: 'Thiruvallur',
    email: '',
    notes: 'Auto driver',
    created_at: '2025-10-15T11:00:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-004',
    name: 'Lakshmi Devi',
    phone: '6543210987',
    location: 'Tiruttani',
    district: 'Thiruvallur',
    email: 'lakshmi.d@yahoo.com',
    notes: 'Settled account — paid in full',
    created_at: '2025-08-20T10:00:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-005',
    name: 'Anbu Raja',
    phone: '9543210876',
    location: 'Minjur',
    district: 'Thiruvallur',
    email: '',
    notes: 'Large account — farm equipment loan',
    created_at: '2025-07-01T09:00:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-006',
    name: 'Senthil Kumar',
    phone: '8432109765',
    location: 'Chennai',
    district: 'Chennai',
    email: 'senthil.k@mail.com',
    notes: 'Overpaid — credit balance',
    created_at: '2025-11-01T08:00:00Z',
    created_by: 'owner-1',
  },
  {
    id: 'cust-007',
    name: 'Kavitha Krishnan',
    phone: '7321098654',
    location: 'Sholinganallur',
    district: 'Chennai',
    email: '',
    notes: 'Small business loan',
    created_at: '2025-12-05T10:00:00Z',
    created_by: 'owner-1',
  },
];

export const mockTransactions = [
  // ── Ravi Kumar (cust-001) ── net positive ─────────────────────────────────
  { id: 'tx-001', client_request_id: 'crq-001', customer_id: 'cust-001', type: 'lent',   amount_paise: 10000000, balance_after_paise: 10000000, transaction_date: '2025-09-12T09:00:00Z', note: 'Initial loan for materials',      reversed_transaction_id: null, created_at: '2025-09-12T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-002', client_request_id: 'crq-002', customer_id: 'cust-001', type: 'repaid', amount_paise:  3000000, balance_after_paise:  7000000, transaction_date: '2025-10-05T10:30:00Z', note: 'Monthly instalment',             reversed_transaction_id: null, created_at: '2025-10-05T10:30:00Z', created_by: 'owner-1' },
  { id: 'tx-003', client_request_id: 'crq-003', customer_id: 'cust-001', type: 'lent',   amount_paise:  5000000, balance_after_paise: 12000000, transaction_date: '2025-11-01T11:00:00Z', note: 'Additional cement bags',          reversed_transaction_id: null, created_at: '2025-11-01T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-004', client_request_id: 'crq-004', customer_id: 'cust-001', type: 'repaid', amount_paise:  3500000, balance_after_paise:  8500000, transaction_date: '2025-11-20T09:00:00Z', note: 'Part payment',                   reversed_transaction_id: null, created_at: '2025-11-20T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-005', client_request_id: 'crq-005', customer_id: 'cust-001', type: 'repaid', amount_paise:  2000000, balance_after_paise:  6500000, transaction_date: '2025-12-15T14:00:00Z', note: 'Dec payment',                    reversed_transaction_id: null, created_at: '2025-12-15T14:00:00Z', created_by: 'owner-1' },
  { id: 'tx-006', client_request_id: 'crq-006', customer_id: 'cust-001', type: 'lent',   amount_paise:  2000000, balance_after_paise:  8500000, transaction_date: '2026-01-10T10:00:00Z', note: 'New year advance',               reversed_transaction_id: null, created_at: '2026-01-10T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-007', client_request_id: 'crq-007', customer_id: 'cust-001', type: 'repaid', amount_paise:  2000000, balance_after_paise:  6500000, transaction_date: '2026-02-08T09:30:00Z', note: 'Feb payment',                    reversed_transaction_id: null, created_at: '2026-02-08T09:30:00Z', created_by: 'owner-1' },
  { id: 'tx-008', client_request_id: 'crq-008', customer_id: 'cust-001', type: 'repaid', amount_paise:  2000000, balance_after_paise:  4500000, transaction_date: '2026-03-10T10:00:00Z', note: 'Mar payment',                    reversed_transaction_id: null, created_at: '2026-03-10T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-009', client_request_id: 'crq-009', customer_id: 'cust-001', type: 'repaid', amount_paise:  1000000, balance_after_paise:  3500000, transaction_date: '2026-04-12T11:00:00Z', note: 'Apr part payment',               reversed_transaction_id: null, created_at: '2026-04-12T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-010', client_request_id: 'crq-010', customer_id: 'cust-001', type: 'repaid', amount_paise:   500000, balance_after_paise:  3000000, transaction_date: '2026-05-20T09:00:00Z', note: 'May payment',                    reversed_transaction_id: null, created_at: '2026-05-20T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-011', client_request_id: 'crq-011', customer_id: 'cust-001', type: 'lent',   amount_paise:  1500000, balance_after_paise:  4500000, transaction_date: '2026-06-05T10:00:00Z', note: 'Roofing materials advance',       reversed_transaction_id: null, created_at: '2026-06-05T10:00:00Z', created_by: 'owner-1' },

  // ── Priya Sundaram (cust-002) ─────────────────────────────────────────────
  { id: 'tx-012', client_request_id: 'crq-012', customer_id: 'cust-002', type: 'lent',   amount_paise: 5000000, balance_after_paise:  5000000, transaction_date: '2025-10-05T10:00:00Z', note: 'Home renovation loan',            reversed_transaction_id: null, created_at: '2025-10-05T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-013', client_request_id: 'crq-013', customer_id: 'cust-002', type: 'lent',   amount_paise: 3000000, balance_after_paise:  8000000, transaction_date: '2025-11-10T11:00:00Z', note: 'Painting work advance',           reversed_transaction_id: null, created_at: '2025-11-10T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-014', client_request_id: 'crq-014', customer_id: 'cust-002', type: 'repaid', amount_paise: 2000000, balance_after_paise:  6000000, transaction_date: '2025-12-01T09:00:00Z', note: 'Salary received — payment',       reversed_transaction_id: null, created_at: '2025-12-01T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-015', client_request_id: 'crq-015', customer_id: 'cust-002', type: 'repaid', amount_paise: 2000000, balance_after_paise:  4000000, transaction_date: '2026-01-05T10:30:00Z', note: 'Jan instalment',                  reversed_transaction_id: null, created_at: '2026-01-05T10:30:00Z', created_by: 'owner-1' },
  { id: 'tx-016', client_request_id: 'crq-016', customer_id: 'cust-002', type: 'repaid', amount_paise: 2000000, balance_after_paise:  2000000, transaction_date: '2026-03-05T10:00:00Z', note: 'Mar instalment',                  reversed_transaction_id: null, created_at: '2026-03-05T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-017', client_request_id: 'crq-017', customer_id: 'cust-002', type: 'lent',   amount_paise: 2500000, balance_after_paise:  4500000, transaction_date: '2026-05-10T09:00:00Z', note: 'Kitchen renovation',              reversed_transaction_id: null, created_at: '2026-05-10T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-018', client_request_id: 'crq-018', customer_id: 'cust-002', type: 'repaid', amount_paise: 1500000, balance_after_paise:  3000000, transaction_date: '2026-06-10T11:00:00Z', note: 'June payment',                    reversed_transaction_id: null, created_at: '2026-06-10T11:00:00Z', created_by: 'owner-1' },

  // ── Murugan Selvam (cust-003) ─────────────────────────────────────────────
  { id: 'tx-019', client_request_id: 'crq-019', customer_id: 'cust-003', type: 'lent',   amount_paise: 1500000, balance_after_paise: 1500000, transaction_date: '2025-10-20T08:30:00Z', note: 'Auto repair loan',                reversed_transaction_id: null, created_at: '2025-10-20T08:30:00Z', created_by: 'owner-1' },
  { id: 'tx-020', client_request_id: 'crq-020', customer_id: 'cust-003', type: 'repaid', amount_paise:  500000, balance_after_paise: 1000000, transaction_date: '2025-11-15T09:00:00Z', note: 'First payment',                   reversed_transaction_id: null, created_at: '2025-11-15T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-021', client_request_id: 'crq-021', customer_id: 'cust-003', type: 'repaid', amount_paise:  200000, balance_after_paise:  800000, transaction_date: '2026-01-20T10:00:00Z', note: 'Jan payment',                     reversed_transaction_id: null, created_at: '2026-01-20T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-022', client_request_id: 'crq-022', customer_id: 'cust-003', type: 'repaid', amount_paise:  200000, balance_after_paise:  600000, transaction_date: '2026-04-05T11:00:00Z', note: 'Apr payment',                     reversed_transaction_id: null, created_at: '2026-04-05T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-023', client_request_id: 'crq-023', customer_id: 'cust-003', type: 'lent',   amount_paise:  300000, balance_after_paise:  900000, transaction_date: '2026-06-01T09:30:00Z', note: 'Spare parts advance',             reversed_transaction_id: null, created_at: '2026-06-01T09:30:00Z', created_by: 'owner-1' },

  // ── Lakshmi Devi (cust-004) — ZERO balance (fully settled) ───────────────
  { id: 'tx-024', client_request_id: 'crq-024', customer_id: 'cust-004', type: 'lent',   amount_paise: 2500000, balance_after_paise: 2500000, transaction_date: '2025-08-25T10:00:00Z', note: 'Education fees loan',             reversed_transaction_id: null, created_at: '2025-08-25T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-025', client_request_id: 'crq-025', customer_id: 'cust-004', type: 'repaid', amount_paise: 1000000, balance_after_paise: 1500000, transaction_date: '2025-09-25T11:00:00Z', note: 'Part repayment',                  reversed_transaction_id: null, created_at: '2025-09-25T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-026', client_request_id: 'crq-026', customer_id: 'cust-004', type: 'repaid', amount_paise: 1500000, balance_after_paise:       0, transaction_date: '2025-10-30T09:30:00Z', note: 'Final payment — fully settled',   reversed_transaction_id: null, created_at: '2025-10-30T09:30:00Z', created_by: 'owner-1' },

  // ── Anbu Raja (cust-005) — LARGE balance ─────────────────────────────────
  { id: 'tx-027', client_request_id: 'crq-027', customer_id: 'cust-005', type: 'lent',   amount_paise: 25000000, balance_after_paise: 25000000, transaction_date: '2025-07-10T09:00:00Z', note: 'Farm tractor down payment',      reversed_transaction_id: null, created_at: '2025-07-10T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-028', client_request_id: 'crq-028', customer_id: 'cust-005', type: 'lent',   amount_paise: 15000000, balance_after_paise: 40000000, transaction_date: '2025-08-15T10:00:00Z', note: 'Irrigation pump loan',           reversed_transaction_id: null, created_at: '2025-08-15T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-029', client_request_id: 'crq-029', customer_id: 'cust-005', type: 'repaid', amount_paise:  5000000, balance_after_paise: 35000000, transaction_date: '2025-09-30T11:00:00Z', note: 'Harvest season payment',         reversed_transaction_id: null, created_at: '2025-09-30T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-030', client_request_id: 'crq-030', customer_id: 'cust-005', type: 'lent',   amount_paise: 10000000, balance_after_paise: 45000000, transaction_date: '2025-11-01T09:00:00Z', note: 'Seeds and fertiliser loan',      reversed_transaction_id: null, created_at: '2025-11-01T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-031', client_request_id: 'crq-031', customer_id: 'cust-005', type: 'repaid', amount_paise:  5000000, balance_after_paise: 40000000, transaction_date: '2025-12-20T10:00:00Z', note: 'Dec harvest payment',            reversed_transaction_id: null, created_at: '2025-12-20T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-032', client_request_id: 'crq-032', customer_id: 'cust-005', type: 'repaid', amount_paise:  5000000, balance_after_paise: 35000000, transaction_date: '2026-02-15T10:30:00Z', note: 'Feb payment',                    reversed_transaction_id: null, created_at: '2026-02-15T10:30:00Z', created_by: 'owner-1' },
  { id: 'tx-033', client_request_id: 'crq-033', customer_id: 'cust-005', type: 'repaid', amount_paise:  5000000, balance_after_paise: 30000000, transaction_date: '2026-04-20T09:00:00Z', note: 'Apr payment',                    reversed_transaction_id: null, created_at: '2026-04-20T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-034', client_request_id: 'crq-034', customer_id: 'cust-005', type: 'repaid', amount_paise:  3000000, balance_after_paise: 27000000, transaction_date: '2026-06-12T11:00:00Z', note: 'Jun part payment',               reversed_transaction_id: null, created_at: '2026-06-12T11:00:00Z', created_by: 'owner-1' },

  // ── Senthil Kumar (cust-006) — NEGATIVE balance (overpayment/credit) ─────
  { id: 'tx-035', client_request_id: 'crq-035', customer_id: 'cust-006', type: 'lent',   amount_paise: 1000000, balance_after_paise:  1000000, transaction_date: '2025-11-05T09:00:00Z', note: 'Small loan',                     reversed_transaction_id: null, created_at: '2025-11-05T09:00:00Z', created_by: 'owner-1' },
  { id: 'tx-036', client_request_id: 'crq-036', customer_id: 'cust-006', type: 'repaid', amount_paise: 1500000, balance_after_paise:  -500000, transaction_date: '2025-12-10T10:00:00Z', note: 'Repaid more than owed (credit)',  reversed_transaction_id: null, created_at: '2025-12-10T10:00:00Z', created_by: 'owner-1' },

  // ── Kavitha Krishnan (cust-007) ───────────────────────────────────────────
  { id: 'tx-037', client_request_id: 'crq-037', customer_id: 'cust-007', type: 'lent',   amount_paise: 2000000, balance_after_paise: 2000000, transaction_date: '2025-12-10T10:00:00Z', note: 'Boutique startup loan',           reversed_transaction_id: null, created_at: '2025-12-10T10:00:00Z', created_by: 'owner-1' },
  { id: 'tx-038', client_request_id: 'crq-038', customer_id: 'cust-007', type: 'lent',   amount_paise: 1000000, balance_after_paise: 3000000, transaction_date: '2026-01-15T09:30:00Z', note: 'Fabric materials advance',        reversed_transaction_id: null, created_at: '2026-01-15T09:30:00Z', created_by: 'owner-1' },
  { id: 'tx-039', client_request_id: 'crq-039', customer_id: 'cust-007', type: 'repaid', amount_paise:  500000, balance_after_paise: 2500000, transaction_date: '2026-03-20T11:00:00Z', note: 'March sales payment',             reversed_transaction_id: null, created_at: '2026-03-20T11:00:00Z', created_by: 'owner-1' },
  { id: 'tx-040', client_request_id: 'crq-040', customer_id: 'cust-007', type: 'repaid', amount_paise:  500000, balance_after_paise: 2000000, transaction_date: '2026-05-15T10:00:00Z', note: 'May payment',                     reversed_transaction_id: null, created_at: '2026-05-15T10:00:00Z', created_by: 'owner-1' },
];

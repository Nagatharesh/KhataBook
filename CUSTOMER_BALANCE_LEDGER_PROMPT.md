PROJECT PROMPT FOR ANTIGRAVITY
Customer Balance Ledger System — HTML/CSS/JS + Supabase

Copy everything below into Antigravity as your project brief. It's split into 3 phases on purpose — **do not let Antigravity skip ahead to Phase 3 before Phase 1 is fully tested.** Money math bugs are 10x cheaper to catch in Phase 1 than after data is live in Supabase.

0. PROJECT SUMMARY

Build a business web app for an **individual owner** to manage customers and the money those customers **owe the owner** — a digital replacement for a handwritten lending notebook (khata).

**Core concept:** the owner lends money to customers over time, and customers pay it back over time. The "balance" for each customer is the amount they currently owe the owner.

**Core entities:**
- Customer (name, phone, location, district, etc.)
- Transaction (**Lent** / **Repaid**, amount, date, note, who recorded it)
- Computed: current balance owed = sum of all transactions for that customer

**Core rule:** the system must be numerically bulletproof. One wrong calculation or rounding error breaks trust in the whole system. Treat this like accounting software, not a toy CRUD app.

**Stack:**
- Frontend: HTML, CSS, vanilla JS (no framework unless you want one — specify if so)
- Backend logic: JavaScript (pure functions, framework-agnostic, testable in isolation)
- Database + Auth: Supabase (Postgres + Supabase Auth)
- Deployment target: (fill in — e.g. Vercel/Netlify static + Supabase cloud)

1. FUNCTIONAL REQUIREMENTS

1.1 Customer
- Add customer: name, phone number, location (address/area), district (text field, **defaults to "Thiruvallur"** but editable in case a customer is from elsewhere), optional email/notes
- Each customer has a derived **current balance owed** (never stored as a raw editable field — always computed from transaction history, see §1.5)
- Search customers by name/phone/location/district (live search, debounced)
- Tap/click a customer → opens detail view showing:
  - Current balance owed (formatted, see §1.6)
  - **Last updated date/time** (last transaction date)
  - Full transaction history (newest first), each row showing: date, type (Lent/Repaid), amount, running balance owed after that transaction, who made the entry, optional note

1.2 Transactions
- Two types only: **Lent** (owner gives money to customer — balance owed increases) and **Repaid** (customer pays money back — balance owed decreases)
- Every transaction requires: customer_id, type, amount (positive number, validated), date (defaults to now, but editable), created_by (auth user/owner), note (optional)
- **No transaction is ever edited or deleted in place.** If a correction is needed, a reversing transaction is added (standard accounting practice — this is what keeps audit trail trustworthy). Add a "reverse this entry" action that creates an offsetting transaction referencing the original.
- **Overpayment rule (decided): warn but allow.** If a "Repaid" amount exceeds the customer's current balance owed, do not block it — instead show a warning on the confirmation screen, e.g. *"This payment is ₹X more than what they currently owe. Their balance will go to -₹X, meaning you now owe them that amount. Continue?"* The owner must explicitly confirm before it's recorded. A negative balance is valid in this system and simply means the owner owes the customer (e.g. an overpayment/credit toward future loans).

1.3 Dashboard & charts

The owner needs an at-a-glance view of overall money flow, not just per-customer detail.

- **Summary cards** (top of dashboard): Total Lent (all-time), Total Repaid (all-time), Net Outstanding (total amount currently owed across all customers) — all formatted per §1.6.
- **In/Out chart**: a bar or line chart comparing money **lent out** vs money **repaid (recovered)**, plotted over time (daily/weekly/monthly toggle, default monthly).
- **Monthly recovery chart**: a chart showing **repaid amount per month** (the owner's actual recovery trend) — bar chart, one bar per month, last 6–12 months by default with the ability to change range.
- Optional but recommended: a small "top outstanding customers" list (customers who owe the most) so the owner knows who to follow up with.
- Charts must be driven by the same immutable transaction data — never a separately maintained/cached number that could drift out of sync. Compute aggregates either client-side from fetched transactions, or via a Supabase view/RPC (see §3 schema) — Phase 1 should include a pure function for this so it's tested before any chart library is wired in.
- Use a lightweight charting approach (e.g. Chart.js via CDN) — keep it simple, no heavy framework needed for vanilla HTML/CSS/JS.

1.4 Confirmation step (mandatory)
- Before any transaction is committed: show a confirmation screen/modal with:
  - Customer name
  - Current balance owed → New balance owed (before/after, both formatted)
  - Transaction type (Lent/Repaid), amount, date, note
  - If the transaction would result in a negative balance (overpayment), an explicit warning message (see §1.2 overpayment rule)
  - Explicit "Confirm" and "Cancel" buttons
- No transaction writes to the database without passing through this screen.

1.5 Balance & audit integrity
- Current balance owed is **never** a manually editable field. It is always `SUM(Lent) - SUM(Repaid)` for that customer, computed either live or via a maintained running total that is reconciled against the transaction sum on read (see Phase 1 testing).
- Every transaction row is immutable once written (enforced at DB level too, see Phase 3).
- Every transaction logs: amount, type, timestamp (server-generated, not client-trusted), created_by user id, and the resulting balance snapshot at that point in time.
- This transaction log **is** the audit trail — there is no separate audit table needed if every balance-changing action is itself a recorded transaction. (Decide if you also want a separate `audit_log` table for non-balance actions like "customer edited", "customer deleted" — recommended: yes, see schema in Phase 3.)

1.6 Number formatting (Indian numbering system)
- All amounts entered/displayed use the **Indian digit grouping**: e.g. `100000` → `1,00,000`, `1234567` → `12,34,567`
- Formatting must:
  - Apply automatically as the user types in the amount field (live formatting, cursor-safe)
  - Apply on all displayed balances and transaction amounts throughout the UI
  - Never affect the underlying stored/calculated value — formatting is presentation-only
- Use `Intl.NumberFormat('en-IN')` as the formatting primitive, but write your own thin wrapper so behavior is centralized in one function used everywhere (no formatting logic duplicated across files)
- Decide and document up front: does the system support paise/decimals, or whole rupees only? **Recommendation: store amounts as integers in the smallest unit (paise) to avoid floating-point errors entirely**, and only convert to rupees for display.

1.7 Export / backup
- A button to export the full dataset (customers + transactions) in **SQL format** (INSERT statements reconstructable into a fresh schema) — and also offer **CSV/JSON** as secondary options
- Export must be a complete, restorable snapshot — not a partial view of whatever's currently filtered on screen (unless explicitly labeled as a filtered export)

2. NON-FUNCTIONAL / EDGE CASES TO HANDLE EXPLICITLY

List these out loud to Antigravity and ask it to write test cases for each before writing UI:

1. **Floating point traps**: 0.1 + 0.2 problems — solved by storing integers (paise), never floats, for money.
2. **Negative / zero amount entry**: reject amount ≤ 0 at validation, both client and DB constraint.
3. **Non-numeric input**: paste of text, emojis, multiple decimal points, leading zeros, negative signs typed into amount field.
4. **Very large numbers**: customer balance in crores — formatting and DB column type (use `bigint` for paise, not `int`) must not overflow.
5. **Resulting negative balance (overpayment)**: decided policy is warn-but-allow (§1.2) — a "Repaid" amount greater than current balance owed must trigger an explicit warning on the confirmation screen, but must still be allowed through on confirm. Test that the resulting negative balance, the warning trigger threshold (exact equality vs. overpayment), and the displayed "owner owes customer" framing are all correct.
6. **Concurrent updates**: two devices add a transaction for the same customer at the same time — balance must still reconcile correctly (this is naturally solved by computing balance as SUM of immutable rows rather than a mutable counter — emphasize this to Antigravity).
7. **Duplicate customer entries**: same phone number — decide: block, warn, or allow (e.g. family members may share a number).
8. **Date edge cases**: backdated transactions (entering a transaction for a past date) must still correctly recompute "current balance" and the chronological running-balance column, not just append at the end.
9. **Search edge cases**: empty query, special characters, partial phone number, case-insensitivity, no results state.
10. **Network/Supabase failure mid-write**: what happens if the confirm button is tapped and the connection drops? No partial/double transaction — use idempotency (e.g. a client-generated UUID per transaction attempt) so retries don't double-insert.
11. **Timezone consistency**: all "last updated" and transaction timestamps stored in UTC, displayed in local/business timezone consistently.
12. **Rounding on display**: ensure formatted display values, when reversed back to numbers, always equal the original stored integer — no silent rounding drift.
13. **Empty states**: new customer with zero transactions — balance shows ₹0, not blank/undefined/NaN.
14. **District default behavior**: "Thiruvallur" should pre-fill the district field on the add-customer form (not silently force it) — the field stays editable, and the default only applies to *new* customers, never overwrites an existing customer's district on edit.
15. **Chart edge cases**: zero transactions overall (charts show empty/zero state, not a crash), a single customer with all activity, months with no activity (must still render as a zero-value bar, not be skipped/missing), and very large monthly totals not breaking the chart's axis scaling/formatting (must still use Indian number formatting on axis labels and tooltips).

3. PHASE PLAN (build and verify in this exact order)

PHASE 1 — Backend logic first, no UI, no database

Goal: prove the money math is correct in total isolation before anything touches a screen or a database.

Ask Antigravity to:
1. Write pure JS modules with no DOM and no Supabase dependency:
   - `formatIndianNumber(paise)` and `parseIndianNumberInput(string)` — must be perfect inverses
   - `calculateBalance(transactions[])` → returns running balance owed + final balance owed
   - `validateTransactionInput({amount, type, date})` → returns `{valid, errors[]}`
   - `buildConfirmationSummary(customer, transaction)` → returns the before/after object the confirmation screen will render, including an `isOverpayment` / `willGoNegative` flag and warning message when a "Repaid" amount exceeds current balance owed
   - `reverseTransaction(originalTransaction)` → returns the offsetting transaction object
   - `aggregateByPeriod(transactions[], period)` → groups transactions by day/week/month and returns `{period, totalLent, totalRepaid, net}` per bucket — this is the data feed for both the in/out chart and the monthly recovery chart. Test edge cases: months with zero transactions still appear in the output (no gaps in the chart), partial months at range boundaries, and transactions dated exactly on a month boundary land in the correct bucket.
2. Write a test suite (plain JS test runner or your preferred one) covering **every edge case in section 2** with explicit input → expected output pairs.
3. Do not proceed to Phase 2 until all tests pass and you've manually reviewed the test list against section 2 line by line.

PHASE 2 — Frontend with sample/mock data (still no real Supabase)

Goal: validate UX and confirmation flow before wiring to a real database.

Ask Antigravity to:
1. Build all screens: customer list + search, customer detail + history, add customer, add transaction, confirmation modal, dashboard (summary cards + in/out chart + monthly recovery chart), export button.
2. Use an in-memory mock dataset (array of fake customers/transactions) standing in for Supabase, behind a small data-access layer (e.g. `customerStore.js`) so swapping in real Supabase later is a one-file change, not a rewrite.
3. Wire the Phase 1 pure functions into the UI — formatting on input, confirmation summary, balance display, chart data via `aggregateByPeriod`.
4. Manually test every edge case from section 2 against the actual UI, not just the unit tests.
5. Implement the export button against the mock dataset first, confirm the SQL/CSV output is valid and re-importable.

PHASE 3 — Supabase: schema, auth, real integration

Goal: move from mock to real backend without breaking anything proven in Phase 1–2.

Ask Antigravity to:
1. Design schema (review/adjust this starting point):

```sql
customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  location text,
  district text not null default 'Thiruvallur',
  notes text,
  created_at timestamptz default now(),
  created_by uuid references auth.users
)

transactions (
  id uuid primary key default gen_random_uuid(),
  client_request_id uuid unique not null, -- idempotency key, see §2.10
  customer_id uuid references customers(id) not null,
  type text not null check (type in ('lent','repaid')),
  amount_paise bigint not null check (amount_paise > 0),
  balance_after_paise bigint not null,
  transaction_date timestamptz not null default now(),
  note text,
  reversed_transaction_id uuid references transactions(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users not null
)

audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null, -- e.g. 'customer_created','customer_edited'
  entity_type text not null,
  entity_id uuid not null,
  changes jsonb,
  created_at timestamptz default now(),
  created_by uuid references auth.users
)
```

**Chart support — monthly aggregate view** (read-only, always derived from `transactions`, never a separately maintained table, so it can't drift out of sync):

```sql
create or replace view monthly_transaction_summary as
select
  date_trunc('month', transaction_date) as month,
  sum(case when type = 'lent' then amount_paise else 0 end) as total_lent_paise,
  sum(case when type = 'repaid' then amount_paise else 0 end) as total_repaid_paise,
  sum(case when type = 'lent' then amount_paise else -amount_paise end) as net_paise
from transactions
group by date_trunc('month', transaction_date)
order by month;
```

Use this view (or an equivalent RPC function) to feed the dashboard charts — avoid pulling every raw transaction row to the client just to aggregate it in JS once the dataset grows large. Add an index on `transactions(transaction_date)` and `transactions(customer_id, transaction_date)` to keep this fast.

2. Enable Row Level Security; policies scoped to the authenticated owner account (single user owns all their customer data — RLS should still be enforced so no one else can read/write it, even though there's only one role for now).
3. Set up Supabase Auth (email/password or magic link — specify your preference) and gate the whole app behind login.
4. Add a DB-level trigger or constraint approach to prevent transaction rows from being UPDATE/DELETEd (enforce immutability at the database, not just the UI).
5. Swap the Phase 2 mock data-access layer for real Supabase calls — this should be a contained change because of the data-access layer abstraction built in Phase 2.
6. Re-run the full edge case checklist (§2) against the real Supabase backend, including the concurrency and network-failure cases — these are the ones mock data can't actually prove.
7. Seed with sample data, verify export-to-SQL round-trips correctly into a fresh Supabase project.
8. Connect the dashboard charts to `monthly_transaction_summary` (or RPC equivalent), verify against seeded sample data that totals match the Phase 1 `aggregateByPeriod` results exactly — these two numbers must never disagree.

4. WHAT TO ASK ANTIGRAVITY FOR AT EACH STEP

When you hand this to Antigravity, work through it phase by phase, not all at once.

Suggested first message to it:
"Let's start with Phase 1 only. Build the pure JS backend logic functions described in section 1 and 2 of this spec, with no UI and no Supabase. Write a full test suite covering every edge case listed in section 2. Show me the test results before we move to Phase 2."

Only paste Phase 2 instructions once Phase 1 tests are green and you've reviewed them yourself. Same for Phase 3.

5. OPEN DECISIONS YOU SHOULD ANSWER BEFORE STARTING

(Antigravity will otherwise guess, and guesses are how money bugs happen)

- [x] Currency: ₹ only (single-owner Indian lending notebook context).
- [x] ~~Can a customer's balance go negative?~~ **Decided: yes, warn-but-allow (see §1.2).**
- [x] ~~Single owner or multiple staff accounts?~~ **Decided: single individual owner using the app themselves (one authenticated user managing all their customers).**
- [ ] Should "last updated" mean last transaction date, or also include profile edits?
- [ ] Export needed as SQL only, or also CSV/Excel for non-technical backup?
- [ ] Any reporting needs (e.g. total amount owed across all customers, list of customers who haven't paid in 30+ days) for a later phase?

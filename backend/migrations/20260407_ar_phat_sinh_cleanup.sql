WITH target_payments AS (
    SELECT
        id,
        invoice_id,
        daily_cash_id,
        journal_entry_id
    FROM ar_invoice_payments
    WHERE "deletedAt" IS NULL
      AND payment_type = 'phat_sinh'
)
UPDATE accounting_daily_cash AS cash
SET "deletedAt" = COALESCE(cash."deletedAt", NOW())
FROM target_payments AS payment
WHERE cash.id = payment.daily_cash_id
  AND cash."deletedAt" IS NULL;

WITH target_payments AS (
    SELECT
        id,
        invoice_id,
        daily_cash_id,
        journal_entry_id
    FROM ar_invoice_payments
    WHERE "deletedAt" IS NULL
      AND payment_type = 'phat_sinh'
)
UPDATE journal_entry_lines AS line
SET "deletedAt" = COALESCE(line."deletedAt", NOW())
FROM target_payments AS payment
WHERE line.journal_entry_id = payment.journal_entry_id
  AND line."deletedAt" IS NULL;

WITH target_payments AS (
    SELECT
        id,
        invoice_id,
        daily_cash_id,
        journal_entry_id
    FROM ar_invoice_payments
    WHERE "deletedAt" IS NULL
      AND payment_type = 'phat_sinh'
)
UPDATE journal_entries AS entry
SET "deletedAt" = COALESCE(entry."deletedAt", NOW())
FROM target_payments AS payment
WHERE entry.id = payment.journal_entry_id
  AND entry."deletedAt" IS NULL;

UPDATE ar_invoice_payments
SET daily_cash_id = NULL,
    journal_entry_id = NULL
WHERE "deletedAt" IS NULL
  AND payment_type = 'phat_sinh'
  AND (daily_cash_id IS NOT NULL OR journal_entry_id IS NOT NULL);

WITH payment_totals AS (
    SELECT
        invoice_id,
        SUM(CASE WHEN "deletedAt" IS NULL AND payment_type = 'tam_ung' THEN COALESCE(amount, 0) ELSE 0 END) AS tam_ung_amount,
        SUM(CASE WHEN "deletedAt" IS NULL AND payment_type = 'phat_sinh' THEN COALESCE(amount, 0) ELSE 0 END) AS phat_sinh_amount
    FROM ar_invoice_payments
    GROUP BY invoice_id
)
UPDATE ar_invoices AS inv
SET paid_amount = COALESCE(payment_totals.tam_ung_amount, 0),
    balance_amount = ROUND((
        COALESCE(inv.total_amount, 0)
        + COALESCE(payment_totals.phat_sinh_amount, 0) * (1 + COALESCE(inv.tax_rate, 0) / 100.0)
        - COALESCE(payment_totals.tam_ung_amount, 0)
    )::numeric, 2),
    status = CASE
        WHEN inv.status = 'cancelled' THEN 'cancelled'
        WHEN inv.status = 'draft' THEN 'draft'
        WHEN ROUND((
            COALESCE(inv.total_amount, 0)
            + COALESCE(payment_totals.phat_sinh_amount, 0) * (1 + COALESCE(inv.tax_rate, 0) / 100.0)
            - COALESCE(payment_totals.tam_ung_amount, 0)
        )::numeric, 2) <= 0 THEN 'paid'
        WHEN inv.due_date IS NOT NULL AND inv.due_date < CURRENT_DATE THEN 'overdue'
        WHEN COALESCE(payment_totals.tam_ung_amount, 0) > 0 THEN 'partially_paid'
        ELSE 'confirmed'
    END
FROM payment_totals
WHERE inv.id = payment_totals.invoice_id
  AND inv."deletedAt" IS NULL;

UPDATE ar_invoices AS inv
SET paid_amount = 0,
    balance_amount = COALESCE(inv.total_amount, 0),
    status = CASE
        WHEN inv.status = 'cancelled' THEN 'cancelled'
        WHEN inv.status = 'draft' THEN 'draft'
        WHEN inv.due_date IS NOT NULL AND inv.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'confirmed'
    END
WHERE inv."deletedAt" IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM ar_invoice_payments AS payment
      WHERE payment.invoice_id = inv.id
        AND payment."deletedAt" IS NULL
  );

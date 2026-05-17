BEGIN;

-- Thêm payment_type vào ar_invoice_payments
-- Giá trị: 'tam_ung' (tạm ứng - đỏ) | 'phat_sinh' (phát sinh - xanh admake)
ALTER TABLE ar_invoice_payments
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) DEFAULT 'phat_sinh';

COMMENT ON COLUMN ar_invoice_payments.payment_type IS 'Loại đợt: tam_ung (tạm ứng) | phat_sinh (phát sinh)';

COMMIT;

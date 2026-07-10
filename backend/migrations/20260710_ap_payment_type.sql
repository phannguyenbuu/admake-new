BEGIN;

-- Thêm payment_type vào ap_bill_payments
ALTER TABLE ap_bill_payments
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) DEFAULT 'tam_ung';

COMMENT ON COLUMN ap_bill_payments.payment_type IS 'Loại đợt: tam_ung (tạm ứng) | phat_sinh (phát sinh)';

COMMIT;

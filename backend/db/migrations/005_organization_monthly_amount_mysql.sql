ALTER TABLE organizations
  ADD COLUMN monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER telefone;

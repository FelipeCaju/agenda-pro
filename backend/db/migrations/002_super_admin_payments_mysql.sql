USE agendapro;

CREATE TABLE IF NOT EXISTS organization_payments (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  reference_month CHAR(7) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'overdue', 'canceled') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  due_date DATE NULL,
  payment_method VARCHAR(60) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_org_payments_org_month (organization_id, reference_month),
  KEY idx_org_payments_org_status (organization_id, status),
  KEY idx_org_payments_due_date (due_date),
  CONSTRAINT fk_org_payments_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

CREATE TRIGGER trg_organization_payments_updated_at
BEFORE UPDATE ON organization_payments
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

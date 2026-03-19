CREATE TABLE IF NOT EXISTS blocked_slots (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  professional_id CHAR(36) NULL,
  data DATE NOT NULL,
  horario_inicial TIME NOT NULL,
  horario_final TIME NOT NULL,
  motivo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_blocked_slots_org_data (organization_id, data, horario_inicial),
  KEY idx_blocked_slots_org_professional (organization_id, professional_id, data),
  CONSTRAINT fk_blocked_slots_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_blocked_slots_professional_same_tenant
    FOREIGN KEY (organization_id, professional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_blocked_slots_updated_at$$
CREATE TRIGGER trg_blocked_slots_updated_at
BEFORE UPDATE ON blocked_slots
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

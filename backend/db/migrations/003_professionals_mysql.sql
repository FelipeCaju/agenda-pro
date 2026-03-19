USE agendapro;

ALTER TABLE appointments
  ADD COLUMN profissional_id CHAR(36) NULL AFTER servico_cor,
  ADD COLUMN profissional_nome VARCHAR(160) NULL AFTER profissional_id;

CREATE INDEX idx_appointments_org_profissional_data
  ON appointments (organization_id, profissional_id, data, horario_inicial);

CREATE TABLE IF NOT EXISTS professionals (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  atividade VARCHAR(160) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_professionals_org_id (organization_id, id),
  KEY idx_professionals_org_nome (organization_id, nome),
  KEY idx_professionals_org_ativo (organization_id, ativo),
  CONSTRAINT fk_professionals_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS professional_services (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  professional_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_professional_services_org_pair (organization_id, professional_id, service_id),
  KEY idx_professional_services_org_service (organization_id, service_id),
  KEY idx_professional_services_org_professional (organization_id, professional_id),
  CONSTRAINT fk_professional_services_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_professional_services_professional_same_tenant
    FOREIGN KEY (organization_id, professional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_professional_services_service_same_tenant
    FOREIGN KEY (organization_id, service_id)
    REFERENCES services (organization_id, id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_professional_same_tenant
    FOREIGN KEY (organization_id, profissional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

DELIMITER $$

CREATE TRIGGER trg_professionals_updated_at
BEFORE UPDATE ON professionals
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_professional_services_updated_at
BEFORE UPDATE ON professional_services
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

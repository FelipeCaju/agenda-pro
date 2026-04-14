ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS ajuste_valor DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER valor;

CREATE TABLE IF NOT EXISTS appointment_items (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NOT NULL,
  servico_id CHAR(36) NULL,
  servico_nome VARCHAR(160) NOT NULL,
  servico_cor VARCHAR(20) NULL,
  ordem INT NOT NULL DEFAULT 0,
  duracao_minutos INT NOT NULL DEFAULT 0,
  valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointment_items_org_appointment (organization_id, appointment_id, ordem),
  KEY idx_appointment_items_org_service (organization_id, servico_id),
  CONSTRAINT fk_appointment_items_appointment
    FOREIGN KEY (appointment_id)
    REFERENCES appointments (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO appointment_items (
  id,
  organization_id,
  appointment_id,
  servico_id,
  servico_nome,
  servico_cor,
  ordem,
  duracao_minutos,
  valor_unitario,
  valor_total
)
SELECT
  UUID(),
  a.organization_id,
  a.id,
  a.servico_id,
  a.servico_nome,
  a.servico_cor,
  0,
  GREATEST(TIMESTAMPDIFF(MINUTE, a.horario_inicial, a.horario_final), 0),
  a.valor,
  a.valor
FROM appointments a
LEFT JOIN appointment_items ai
  ON ai.organization_id = a.organization_id
 AND ai.appointment_id = a.id
WHERE ai.id IS NULL;

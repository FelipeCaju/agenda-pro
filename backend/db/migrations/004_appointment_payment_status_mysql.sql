USE agendapro;

ALTER TABLE appointments
  ADD COLUMN payment_status ENUM('pendente', 'pago') NOT NULL DEFAULT 'pendente' AFTER status;

UPDATE appointments
SET payment_status = CASE
  WHEN status IN ('confirmado', 'concluido') THEN 'pago'
  ELSE 'pendente'
END;

CREATE INDEX idx_appointments_org_payment_status_data
  ON appointments (organization_id, payment_status, data, horario_inicial);

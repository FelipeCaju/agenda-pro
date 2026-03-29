ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS quote_id CHAR(36) NULL AFTER resposta_whatsapp,
  ADD COLUMN IF NOT EXISTS service_order_id CHAR(36) NULL AFTER quote_id;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  status ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes TEXT NULL,
  appointment_id CHAR(36) NULL,
  service_order_id CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quotes_org_status_created (organization_id, status, created_at),
  KEY idx_quotes_org_cliente_created (organization_id, cliente_id, created_at),
  CONSTRAINT fk_quotes_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_quotes_client_same_tenant
    FOREIGN KEY (organization_id, cliente_id)
    REFERENCES clients (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  quote_id CHAR(36) NOT NULL,
  servico_id CHAR(36) NULL,
  servico_nome VARCHAR(160) NOT NULL,
  descricao_livre VARCHAR(255) NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quote_items_quote (quote_id),
  KEY idx_quote_items_org_quote (organization_id, quote_id),
  CONSTRAINT fk_quote_items_quote
    FOREIGN KEY (quote_id)
    REFERENCES quotes (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_orders (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  quote_id CHAR(36) NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  status ENUM('aberta', 'em_execucao', 'concluida', 'cancelada') NOT NULL DEFAULT 'aberta',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_service_orders_org_status_created (organization_id, status, created_at),
  CONSTRAINT fk_service_orders_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_order_items (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  service_order_id CHAR(36) NOT NULL,
  servico_id CHAR(36) NULL,
  servico_nome VARCHAR(160) NOT NULL,
  descricao_livre VARCHAR(255) NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_service_order_items_order (service_order_id),
  CONSTRAINT fk_service_order_items_order
    FOREIGN KEY (service_order_id)
    REFERENCES service_orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

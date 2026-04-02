USE agendapro;

ALTER TABLE organizations
  ADD COLUMN billing_address VARCHAR(180) NULL AFTER cpf_cnpj,
  ADD COLUMN billing_address_number VARCHAR(30) NULL AFTER billing_address,
  ADD COLUMN billing_address_complement VARCHAR(120) NULL AFTER billing_address_number,
  ADD COLUMN billing_postal_code VARCHAR(12) NULL AFTER billing_address_complement,
  ADD COLUMN billing_province VARCHAR(120) NULL AFTER billing_postal_code,
  ADD COLUMN billing_city_ibge VARCHAR(12) NULL AFTER billing_province;

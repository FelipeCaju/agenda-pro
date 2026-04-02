USE agendapro;

ALTER TABLE organizations
  ADD COLUMN cpf_cnpj VARCHAR(20) NULL AFTER telefone;

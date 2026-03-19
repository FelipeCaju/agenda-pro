ALTER TABLE users
  ADD COLUMN apple_id VARCHAR(190) NULL AFTER google_id,
  ADD COLUMN auth_provider ENUM('email', 'google', 'apple') NOT NULL DEFAULT 'email' AFTER apple_id,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER auth_provider;

ALTER TABLE users
  ADD UNIQUE KEY uq_users_organization_apple_id (organization_id, apple_id);

UPDATE users
SET auth_provider = 'email'
WHERE auth_provider IS NULL OR auth_provider = '';

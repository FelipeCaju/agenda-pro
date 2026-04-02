USE agendapro;

ALTER TABLE billing_transactions
  MODIFY COLUMN pix_qr_code_image_url LONGTEXT COLLATE utf8mb4_unicode_ci NULL;

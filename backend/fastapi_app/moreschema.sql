ALTER TABLE notifications
ADD COLUMN notification_metadata TEXT NULL;

ALTER TABLE transfer_requests
ADD COLUMN custodian_id INT NULL,
ADD CONSTRAINT fk_transfer_custodian
  FOREIGN KEY (custodian_id) REFERENCES users(id);

   ALTER TABLE auctions ADD COLUMN location VARCHAR(255);
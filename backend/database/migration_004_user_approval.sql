USE trustvault;

-- Run this migration once. Existing accounts remain approved.
ALTER TABLE users
    MODIFY COLUMN role ENUM('admin', 'owner', 'editor', 'viewer')
    NOT NULL DEFAULT 'viewer';

ALTER TABLE users
    ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected')
    NOT NULL DEFAULT 'approved' AFTER is_active;

CREATE INDEX idx_users_approval_status ON users(approval_status);
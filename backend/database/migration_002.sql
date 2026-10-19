
USE trustvault;

CREATE TABLE IF NOT EXISTS audit_chain_head (
    id TINYINT PRIMARY KEY,
    last_hash CHAR(64) NULL
);

INSERT IGNORE INTO audit_chain_head (id, last_hash)
VALUES (1, NULL);

CREATE TABLE IF NOT EXISTS department_memberships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    assigned_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, department_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_permission_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    action VARCHAR(30) NOT NULL,
    actor_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES access_groups(id),
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX idx_department_membership_user
    ON department_memberships(user_id);

USE trustvault;

CREATE TABLE IF NOT EXISTS department_document_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    permission ENUM('read', 'edit') NOT NULL,
    granted_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_department_document_permission (
        department_id,
        document_id
    ),

    INDEX idx_department_permission_document (document_id),
    INDEX idx_department_permission_department (department_id),

    CONSTRAINT fk_ddp_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ddp_document
        FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ddp_granted_by
        FOREIGN KEY (granted_by)
        REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
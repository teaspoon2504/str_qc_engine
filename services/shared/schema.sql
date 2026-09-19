-- PostgreSQL Schema for AML STR Quality Control System

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ANALYST',
    email VARCHAR(100),
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_extractions (
    id SERIAL PRIMARY KEY,
    document_id INT UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    document_id INT UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    final_score NUMERIC(4,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_weight NUMERIC(6,2) NOT NULL,
    flagged_count INT NOT NULL DEFAULT 0,
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_items (
    id SERIAL PRIMARY KEY,
    evaluation_id INT REFERENCES evaluations(id) ON DELETE CASCADE,
    item_id VARCHAR(20) NOT NULL,
    section_id INT NOT NULL,
    section_name VARCHAR(150) NOT NULL,
    section_weight NUMERIC(5,2) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_desc TEXT,
    extracted_value TEXT,
    weight NUMERIC(5,2) NOT NULL,
    score NUMERIC(4,2) NOT NULL,
    comment TEXT,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_comments (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    admin_name VARCHAR(100) NOT NULL,
    section_id INT,
    item_id VARCHAR(20),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    document_id INT UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    admin_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    decision_notes TEXT,
    stamped_pdf_path VARCHAR(500),
    stamped_docx_path VARCHAR(500),
    decision_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    actor_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_items_eval_id ON evaluation_items(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_admin_comments_doc_id ON admin_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_doc_id ON audit_logs(document_id);

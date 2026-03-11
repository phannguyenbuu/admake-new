BEGIN;

CREATE TABLE IF NOT EXISTS document_center_document (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(120) NOT NULL,
    type VARCHAR(60) NOT NULL,
    "docDate" DATE NOT NULL,
    "partnerId" VARCHAR(80),
    "partnerName" VARCHAR(255),
    "projectId" VARCHAR(80),
    "projectName" VARCHAR(255),
    "taskId" VARCHAR(80),
    amount DOUBLE PRECISION DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'draft',
    description TEXT,
    note TEXT,
    tags JSON DEFAULT '[]',
    "createdBy" VARCHAR(80),
    "approvedBy" VARCHAR(80),
    legacy_document_id VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS document_center_attachment (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES document_center_document(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120),
    size BIGINT,
    "storageKey" VARCHAR(255),
    url VARCHAR(255),
    "uploadedBy" VARCHAR(80),
    "uploadedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS document_center_link (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES document_center_document(id) ON DELETE CASCADE,
    linked_document_id VARCHAR(50),
    link_type VARCHAR(80),
    note VARCHAR(255),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS document_center_audit_log (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES document_center_document(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    actor_id VARCHAR(80),
    actor_name VARCHAR(255),
    payload JSON DEFAULT '{}',
    "actedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_center_doc_lead_code
    ON document_center_document (lead_id, code);
CREATE INDEX IF NOT EXISTS ix_doc_center_doc_lead_docDate
    ON document_center_document (lead_id, "docDate");
CREATE INDEX IF NOT EXISTS ix_doc_center_doc_lead_type
    ON document_center_document (lead_id, type);
CREATE INDEX IF NOT EXISTS ix_doc_center_doc_lead_status
    ON document_center_document (lead_id, status);
CREATE INDEX IF NOT EXISTS ix_doc_center_doc_lead_partnerId
    ON document_center_document (lead_id, "partnerId");
CREATE INDEX IF NOT EXISTS ix_doc_center_doc_lead_projectId
    ON document_center_document (lead_id, "projectId");
CREATE INDEX IF NOT EXISTS ix_doc_center_attachment_document
    ON document_center_attachment (document_id);
CREATE INDEX IF NOT EXISTS ix_doc_center_link_document
    ON document_center_link (document_id);
CREATE INDEX IF NOT EXISTS ix_doc_center_link_linked_document
    ON document_center_link (linked_document_id);
CREATE INDEX IF NOT EXISTS ix_doc_center_audit_document
    ON document_center_audit_log (document_id);
CREATE INDEX IF NOT EXISTS ix_doc_center_audit_actedAt
    ON document_center_audit_log ("actedAt");

INSERT INTO document_center_document (
    id,
    lead_id,
    code,
    type,
    "docDate",
    "partnerName",
    "projectName",
    amount,
    currency,
    status,
    description,
    note,
    tags,
    legacy_document_id,
    "createdAt",
    "updatedAt",
    "deletedAt",
    version
)
SELECT
    ad.id,
    ad.lead_id,
    COALESCE(NULLIF(ad.doc_no, ''), CONCAT('LEG-', TO_CHAR(COALESCE(ad.doc_date, NOW()::DATE), 'YYYYMM'), '-', ad.id)),
    CASE ad.doc_type
        WHEN 'BANG_BAO_GIA' THEN 'QUOTE'
        WHEN 'HOP_DONG_KINH_TE' THEN 'CONTRACT'
        WHEN 'BB_TAM_UNG' THEN 'ADVANCE_REQUEST'
        WHEN 'BB_NGHIEM_THU' THEN 'ACCEPTANCE'
        WHEN 'DE_NGHI_THANH_TOAN' THEN 'PAYMENT_REQUEST'
        WHEN 'THANH_LY_HOP_DONG' THEN 'LIQUIDATION'
        WHEN 'HOA_DON' THEN 'INVOICE_IN'
        ELSE 'OTHER'
    END,
    COALESCE(ad.doc_date, NOW()::DATE),
    ad.partner_name,
    ad.project_name,
    COALESCE(ad.amount, 0),
    COALESCE(NULLIF(ad.currency, ''), 'VND'),
    CASE ad.status
        WHEN 'pending' THEN 'submitted'
        WHEN 'approved' THEN 'approved'
        WHEN 'issued' THEN 'invoiced'
        WHEN 'archived' THEN 'closed'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'draft'
    END,
    ad.content,
    ad.material_name,
    COALESCE(ad.tags, '[]'::json),
    ad.id,
    ad."createdAt",
    ad."updatedAt",
    ad."deletedAt",
    ad.version
FROM accounting_document ad
WHERE NOT EXISTS (
    SELECT 1
    FROM document_center_document d
    WHERE d.legacy_document_id = ad.id
);

COMMIT;

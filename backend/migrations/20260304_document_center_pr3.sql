BEGIN;

ALTER TABLE document_center_attachment
    ALTER COLUMN document_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS ix_doc_center_attachment_uploadedAt
    ON document_center_attachment ("uploadedAt");

INSERT INTO document_center_attachment (
    id,
    document_id,
    filename,
    "mimeType",
    size,
    "storageKey",
    url,
    "uploadedBy",
    "uploadedAt",
    "createdAt",
    "updatedAt",
    "deletedAt",
    version
)
SELECT
    CONCAT('att_', SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 24)) AS id,
    d.id AS document_id,
    COALESCE(NULLIF((item->>'filename'), ''), (item->>'file_url')) AS filename,
    NULL AS "mimeType",
    NULL AS size,
    (item->>'file_url') AS "storageKey",
    CASE
        WHEN (item->>'file_url') IS NULL OR (item->>'file_url') = '' THEN NULL
        WHEN (item->>'file_url') LIKE 'http%' THEN (item->>'file_url')
        ELSE CONCAT('/static/', (item->>'file_url'))
    END AS url,
    NULL AS "uploadedBy",
    ad."updatedAt" AS "uploadedAt",
    ad."createdAt",
    ad."updatedAt",
    ad."deletedAt",
    ad.version
FROM accounting_document ad
JOIN document_center_document d ON d.legacy_document_id = ad.id
CROSS JOIN LATERAL json_array_elements(COALESCE(ad.attachments, '[]'::json)) AS item
WHERE COALESCE((item->>'file_url'), '') <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM document_center_attachment a
      WHERE a.document_id = d.id
        AND a."storageKey" = (item->>'file_url')
  );

COMMIT;

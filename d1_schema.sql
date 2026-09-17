-- Cloudflare D1 Schema for Labor Management App
CREATE TABLE IF NOT EXISTS kv (
    collection TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (collection, key)
);

CREATE INDEX IF NOT EXISTS idx_kv_collection ON kv(collection);

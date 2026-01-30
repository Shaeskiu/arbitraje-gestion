-- Esquema mínimo para Supabase Storage API (facturas y archivos)
-- Necesario para que el servicio storage-api funcione con Kong/PostgREST

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id uuid REFERENCES storage.buckets(id) ON DELETE CASCADE,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE (bucket_id, name)
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);

GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.objects TO postgres, anon, authenticated, service_role;

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para que el service_role pueda gestionar todo
CREATE POLICY "Service role full access on buckets"
    ON storage.buckets FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on objects"
    ON storage.objects FOR ALL
    USING (true)
    WITH CHECK (true);

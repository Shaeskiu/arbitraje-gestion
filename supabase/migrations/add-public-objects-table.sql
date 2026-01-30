-- La Storage API hace INSERT ... ON CONFLICT (name, bucket_id); las vistas no tienen
-- constraint y fallan. Creamos public.objects como TABLA con UNIQUE(bucket_id, name)
-- y un trigger que sincroniza a storage.objects.

DROP TRIGGER IF EXISTS objects_instead_of_insert ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_update ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_delete ON public.objects;
DROP VIEW IF EXISTS public.objects CASCADE;

-- Tabla public.objects (misma estructura que storage.objects, con constraint para ON CONFLICT)
CREATE TABLE IF NOT EXISTS public.objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text,
    name text NOT NULL,
    owner uuid,
    owner_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    user_metadata jsonb DEFAULT '{}'::jsonb,
    version text,
    UNIQUE (bucket_id, name)
);

-- Sincronizar a storage.objects al insertar/actualizar en public.objects
CREATE OR REPLACE FUNCTION public.sync_objects_to_storage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.objects (id, bucket_id, name, owner, owner_id, created_at, updated_at, last_accessed_at, metadata, user_metadata, version)
    VALUES (NEW.id, NEW.bucket_id, NEW.name, NEW.owner, NEW.owner_id, NEW.created_at, NEW.updated_at, NEW.last_accessed_at, COALESCE(NEW.metadata,'{}'::jsonb), COALESCE(NEW.user_metadata,'{}'::jsonb), NEW.version)
    ON CONFLICT (bucket_id, name) DO UPDATE SET
        version = EXCLUDED.version,
        updated_at = now(),
        metadata = COALESCE(EXCLUDED.metadata, storage.objects.metadata),
        user_metadata = COALESCE(EXCLUDED.user_metadata, storage.objects.user_metadata);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_objects_after_insert
    AFTER INSERT ON public.objects FOR EACH ROW EXECUTE FUNCTION public.sync_objects_to_storage();
CREATE TRIGGER sync_objects_after_update
    AFTER UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.sync_objects_to_storage();

GRANT ALL ON public.objects TO postgres, anon, authenticated, service_role;

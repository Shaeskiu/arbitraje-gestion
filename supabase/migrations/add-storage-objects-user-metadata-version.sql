-- La Storage API v1.7 inserta en objects con user_metadata y version.
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS user_metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS version text;

-- Actualizar vista public.objects para incluir las nuevas columnas
DROP VIEW IF EXISTS public.objects CASCADE;
CREATE VIEW public.objects AS
SELECT
    id,
    bucket_id,
    name,
    owner,
    owner_id,
    created_at,
    updated_at,
    last_accessed_at,
    metadata,
    user_metadata,
    version
FROM storage.objects;

-- Recrear triggers (las funciones ya existen pero hay que actualizarlas para user_metadata y version)
-- Upsert: la Storage API usa ON CONFLICT (name, bucket_id) DO UPDATE; la vista no tiene constraint, así que hacemos upsert en el trigger
CREATE OR REPLACE FUNCTION public.objects_instead_of_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.objects (id, bucket_id, name, owner, owner_id, created_at, updated_at, last_accessed_at, metadata, user_metadata, version)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.bucket_id,
        NEW.name,
        COALESCE(NEW.owner, NEW.owner_id),
        COALESCE(NEW.owner_id, NEW.owner),
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now()),
        COALESCE(NEW.last_accessed_at, now()),
        COALESCE(NEW.metadata, '{}'::jsonb),
        COALESCE(NEW.user_metadata, '{}'::jsonb),
        NEW.version
    )
    ON CONFLICT (bucket_id, name) DO UPDATE SET
        version = EXCLUDED.version,
        updated_at = now(),
        metadata = COALESCE(EXCLUDED.metadata, storage.objects.metadata),
        user_metadata = COALESCE(EXCLUDED.user_metadata, storage.objects.user_metadata)
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.objects_instead_of_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE storage.objects SET
        bucket_id = COALESCE(NEW.bucket_id, OLD.bucket_id),
        name = COALESCE(NEW.name, OLD.name),
        owner = COALESCE(NEW.owner, OLD.owner),
        owner_id = COALESCE(NEW.owner_id, OLD.owner_id),
        created_at = COALESCE(NEW.created_at, OLD.created_at),
        updated_at = COALESCE(NEW.updated_at, now()),
        last_accessed_at = COALESCE(NEW.last_accessed_at, OLD.last_accessed_at),
        metadata = COALESCE(NEW.metadata, OLD.metadata),
        user_metadata = COALESCE(NEW.user_metadata, OLD.user_metadata),
        version = COALESCE(NEW.version, OLD.version)
    WHERE id = OLD.id
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS objects_instead_of_insert ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_update ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_delete ON public.objects;
CREATE TRIGGER objects_instead_of_insert INSTEAD OF INSERT ON public.objects FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_insert();
CREATE TRIGGER objects_instead_of_update INSTEAD OF UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_update();
CREATE TRIGGER objects_instead_of_delete INSTEAD OF DELETE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_delete();

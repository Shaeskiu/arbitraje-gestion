-- La Storage API de Supabase usa owner_id (no solo owner). Añadimos la columna
-- para que la creación de buckets y objetos funcione.

ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Recrear vistas (no se puede cambiar orden de columnas con CREATE OR REPLACE)
DROP VIEW IF EXISTS public.objects CASCADE;
DROP VIEW IF EXISTS public.buckets CASCADE;

CREATE VIEW public.buckets AS
SELECT
    id,
    name,
    owner,
    owner_id,
    created_at,
    updated_at,
    "public",
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- Trigger INSERT: incluir owner_id
CREATE OR REPLACE FUNCTION public.buckets_instead_of_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, owner, owner_id, created_at, updated_at, "public", avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.name,
        COALESCE(NEW.owner, NEW.owner_id),
        COALESCE(NEW.owner_id, NEW.owner),
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now()),
        COALESCE(NEW."public", false),
        COALESCE(NEW.avif_autodetection, false),
        NEW.file_size_limit,
        NEW.allowed_mime_types
    )
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger UPDATE: incluir owner_id
CREATE OR REPLACE FUNCTION public.buckets_instead_of_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE storage.buckets SET
        name = COALESCE(NEW.name, OLD.name),
        owner = COALESCE(NEW.owner, OLD.owner),
        owner_id = COALESCE(NEW.owner_id, OLD.owner_id),
        created_at = COALESCE(NEW.created_at, OLD.created_at),
        updated_at = COALESCE(NEW.updated_at, now()),
        "public" = COALESCE(NEW."public", OLD."public"),
        avif_autodetection = COALESCE(NEW.avif_autodetection, OLD.avif_autodetection),
        file_size_limit = NEW.file_size_limit,
        allowed_mime_types = NEW.allowed_mime_types
    WHERE id = OLD.id
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear triggers para public.buckets (ya existen las funciones)
DROP TRIGGER IF EXISTS buckets_instead_of_insert ON public.buckets;
DROP TRIGGER IF EXISTS buckets_instead_of_update ON public.buckets;
DROP TRIGGER IF EXISTS buckets_instead_of_delete ON public.buckets;
CREATE TRIGGER buckets_instead_of_insert INSTEAD OF INSERT ON public.buckets FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_insert();
CREATE TRIGGER buckets_instead_of_update INSTEAD OF UPDATE ON public.buckets FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_update();
CREATE TRIGGER buckets_instead_of_delete INSTEAD OF DELETE ON public.buckets FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_delete();

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
    metadata
FROM storage.objects;

CREATE OR REPLACE FUNCTION public.objects_instead_of_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.objects (id, bucket_id, name, owner, owner_id, created_at, updated_at, last_accessed_at, metadata)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.bucket_id,
        NEW.name,
        COALESCE(NEW.owner, NEW.owner_id),
        COALESCE(NEW.owner_id, NEW.owner),
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now()),
        COALESCE(NEW.last_accessed_at, now()),
        COALESCE(NEW.metadata, '{}'::jsonb)
    )
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
        metadata = COALESCE(NEW.metadata, OLD.metadata)
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

-- Vistas en public que redirigen a storage.buckets y storage.objects
-- para que el Storage API (que puede usar search_path=public) encuentre
-- las tablas y las operaciones se ejecuten en el esquema storage.
--
-- Requiere que add-storage-schema.sql ya se haya aplicado (esquema storage y tablas).
--
-- Aplicar migración (desde la raíz del proyecto):
--   Linux/Mac:  make db-migrate
--   Windows:   Get-Content supabase\migrations\add-public-storage-views.sql -Raw | docker exec -i arbitraje-supabase-db psql -U postgres -d postgres

-- 1) Vista public.buckets -> storage.buckets
CREATE OR REPLACE VIEW public.buckets AS
SELECT
    id,
    name,
    owner,
    created_at,
    updated_at,
    "public",
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- Triggers INSTEAD OF para public.buckets
CREATE OR REPLACE FUNCTION public.buckets_instead_of_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, "public", avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.name,
        NEW.owner,
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

CREATE OR REPLACE FUNCTION public.buckets_instead_of_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE storage.buckets SET
        name = COALESCE(NEW.name, OLD.name),
        owner = NEW.owner,
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

CREATE OR REPLACE FUNCTION public.buckets_instead_of_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM storage.buckets WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buckets_instead_of_insert ON public.buckets;
DROP TRIGGER IF EXISTS buckets_instead_of_update ON public.buckets;
DROP TRIGGER IF EXISTS buckets_instead_of_delete ON public.buckets;

CREATE TRIGGER buckets_instead_of_insert
    INSTEAD OF INSERT ON public.buckets
    FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_insert();

CREATE TRIGGER buckets_instead_of_update
    INSTEAD OF UPDATE ON public.buckets
    FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_update();

CREATE TRIGGER buckets_instead_of_delete
    INSTEAD OF DELETE ON public.buckets
    FOR EACH ROW EXECUTE FUNCTION public.buckets_instead_of_delete();


-- 2) Vista public.objects -> storage.objects
CREATE OR REPLACE VIEW public.objects AS
SELECT
    id,
    bucket_id,
    name,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects;

CREATE OR REPLACE FUNCTION public.objects_instead_of_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.bucket_id,
        NEW.name,
        NEW.owner,
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
        owner = NEW.owner,
        created_at = COALESCE(NEW.created_at, OLD.created_at),
        updated_at = COALESCE(NEW.updated_at, now()),
        last_accessed_at = COALESCE(NEW.last_accessed_at, OLD.last_accessed_at),
        metadata = COALESCE(NEW.metadata, OLD.metadata)
    WHERE id = OLD.id
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.objects_instead_of_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM storage.objects WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS objects_instead_of_insert ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_update ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_delete ON public.objects;

CREATE TRIGGER objects_instead_of_insert
    INSTEAD OF INSERT ON public.objects
    FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_insert();

CREATE TRIGGER objects_instead_of_update
    INSTEAD OF UPDATE ON public.objects
    FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_update();

CREATE TRIGGER objects_instead_of_delete
    INSTEAD OF DELETE ON public.objects
    FOR EACH ROW EXECUTE FUNCTION public.objects_instead_of_delete();

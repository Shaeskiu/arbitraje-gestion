-- El Storage API hace INSERT ... ON CONFLICT (name, bucket_id) que no funciona
-- sobre una vista (no hay constraint). Eliminamos la vista public.objects para
-- que el INSERT vaya a storage.objects (search_path=storage,public).
DROP TRIGGER IF EXISTS objects_instead_of_insert ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_update ON public.objects;
DROP TRIGGER IF EXISTS objects_instead_of_delete ON public.objects;
DROP VIEW IF EXISTS public.objects CASCADE;

-- Los triggers que insertan en storage.buckets y storage.objects se ejecutan
-- con el usuario de la Storage API y RLS bloquea. SECURITY DEFINER hace que
-- las funciones se ejecuten como el propietario (postgres) y puedan insertar.

ALTER FUNCTION public.buckets_instead_of_insert() SECURITY DEFINER;
ALTER FUNCTION public.buckets_instead_of_update() SECURITY DEFINER;
ALTER FUNCTION public.buckets_instead_of_delete() SECURITY DEFINER;

ALTER FUNCTION public.sync_objects_to_storage() SECURITY DEFINER;

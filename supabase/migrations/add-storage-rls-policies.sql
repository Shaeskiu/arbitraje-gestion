-- Políticas RLS para storage.buckets y storage.objects
-- Sin políticas, RLS deniega todo. El Storage API y el backend necesitan poder insertar/actualizar/eliminar.

DROP POLICY IF EXISTS "Allow all for storage api" ON storage.buckets;
CREATE POLICY "Allow all for storage api" ON storage.buckets
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for storage api" ON storage.objects;
CREATE POLICY "Allow all for storage api" ON storage.objects
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

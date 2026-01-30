-- Usuario para el Storage API con search_path=storage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'storage_admin') THEN
    CREATE ROLE storage_admin LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
  END IF;
END
$$;
GRANT USAGE ON SCHEMA storage TO storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO storage_admin;
ALTER ROLE storage_admin SET search_path TO storage;

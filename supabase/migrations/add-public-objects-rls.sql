ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.objects;
CREATE POLICY "Allow all" ON public.objects FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

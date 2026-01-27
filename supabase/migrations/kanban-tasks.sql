-- ============================================
-- KANBAN DE TAREAS SEMANALES
-- ============================================
-- Tablas para gestionar tareas tipo kanban:
-- - kanban_tasks
-- - kanban_comments
--
-- Estados soportados:
--   - nueva_idea
--   - esta_semana
--   - solucionado
--
-- Cualquier usuario autenticado puede crear, ver, editar y borrar
-- tareas y comentarios (gestión compartida entre el equipo).

-- ============================================
-- TABLA: kanban_tasks
-- ============================================

CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'nueva_idea' CHECK (status IN ('nueva_idea', 'esta_semana', 'solucionado')),
    assignee_email TEXT,
    created_by_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para mantener updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_kanban_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_kanban_tasks_updated_at
            BEFORE UPDATE ON public.kanban_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- TABLA: kanban_comments
-- ============================================

CREATE TABLE IF NOT EXISTS public.kanban_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.kanban_tasks(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS Y POLÍTICAS
-- ============================================

ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede hacer cualquier operación
-- (uso interno por un equipo pequeño), igual que en compras/stock/ventas

CREATE POLICY "Allow all operations on kanban_tasks"
    ON public.kanban_tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on kanban_comments"
    ON public.kanban_comments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración kanban: tablas kanban_tasks y kanban_comments creadas o actualizadas';
END $$;


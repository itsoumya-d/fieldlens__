-- 009_tasks.sql
-- FieldLens: tasks and task_steps tables for the Library and Task screens
-- These provide step-by-step trade task guides separate from the existing guides/guide_sections

CREATE TABLE IF NOT EXISTS public.tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade            TEXT NOT NULL DEFAULT 'general',
    title            TEXT NOT NULL,
    description      TEXT,
    difficulty       TEXT NOT NULL DEFAULT 'beginner'
                       CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    estimated_minutes INTEGER NOT NULL DEFAULT 30,
    is_published     BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium       BOOLEAN NOT NULL DEFAULT FALSE,
    tags             TEXT[] DEFAULT '{}',
    cover_image_url  TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    view_count       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_trade ON public.tasks(trade);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON public.tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_tasks_published ON public.tasks(is_published) WHERE is_published = TRUE;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks are publicly readable when published
CREATE POLICY "tasks_select_published" ON public.tasks
    FOR SELECT USING (is_published = TRUE);

-- ============================================================
-- task_steps (child of tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_steps (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id           UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    step_number       INTEGER NOT NULL,
    title             TEXT NOT NULL,
    instructions      TEXT NOT NULL,
    tools             TEXT[] DEFAULT '{}',
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    tips              TEXT[] DEFAULT '{}',
    common_mistakes   TEXT[] DEFAULT '{}',
    code_reference    TEXT,
    media_url         TEXT,
    media_type        TEXT CHECK (media_type IN ('image', 'video', 'diagram')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_task_steps_task ON public.task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_order ON public.task_steps(task_id, step_number);

ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;

-- Steps inherit readability from parent task
CREATE POLICY "task_steps_select" ON public.task_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_steps.task_id AND tasks.is_published = TRUE
        )
    );

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_tasks_updated_at();

CREATE TRIGGER tr_task_steps_updated_at
    BEFORE UPDATE ON public.task_steps
    FOR EACH ROW EXECUTE FUNCTION public.set_tasks_updated_at();

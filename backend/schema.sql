-- ==========================================
-- 1. EXTENSIONS & FUNCTIONS
-- ==========================================
-- Enable UUID generator (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reusable function to auto-update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. TABLE CREATION
-- ==========================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY DEFAULT 1,
    master_password_hash VARCHAR(255) NOT NULL,
    google_oauth_access_token TEXT,
    google_oauth_refresh_token TEXT,
    google_oauth_expires_at TIMESTAMPTZ,
    google_user_email VARCHAR(255),
    gemini_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraint to enforce single-user capability
    CONSTRAINT sole_user_record CHECK (id = 1)
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id INTEGER DEFAULT 1 NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    priority_severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'backlog' NOT NULL,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_tasks_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_estimated_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT chk_priority CHECK (priority_severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_status CHECK (status IN ('backlog', 'in_progress', 'completed', 'archived'))
);

-- Table: focus_blocks
CREATE TABLE IF NOT EXISTS focus_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id INTEGER DEFAULT 1 NOT NULL,
    task_id UUID,
    google_event_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
    rescheduled_from_event_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_focus_blocks_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_focus_blocks_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT chk_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_focus_status CHECK (status IN ('scheduled', 'active', 'completed', 'missed', 'cancelled'))
);

-- Table: ai_interventions
CREATE TABLE IF NOT EXISTS ai_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id INTEGER DEFAULT 1 NOT NULL,
    task_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    trigger_reason TEXT,
    content_payload JSONB NOT NULL,
    snoozed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_interventions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_interventions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT chk_intervention_type CHECK (type IN ('draft_proposal', 'scheduling_proposal', 'procrastination_nudge')),
    CONSTRAINT chk_intervention_status CHECK (status IN ('pending', 'accepted', 'snoozed', 'dismissed'))
);

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);

CREATE INDEX IF NOT EXISTS idx_focus_blocks_task_id ON focus_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_times ON focus_blocks(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_ai_interventions_task_id ON ai_interventions(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_status ON ai_interventions(status);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_snoozed ON ai_interventions(snoozed_until) WHERE status = 'snoozed';

-- ==========================================
-- 4. TRIGGERS FOR AUTO-UPDATED_AT
-- ==========================================
CREATE TRIGGER trg_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_focus_blocks_updated_at
    BEFORE UPDATE ON focus_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_ai_interventions_updated_at
    BEFORE UPDATE ON ai_interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

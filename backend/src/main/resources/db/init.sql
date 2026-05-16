-- ═══════════════════════════════════════════════════════════
-- AnonConnect Database Initialization
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(100),
    country         VARCHAR(3),
    gender          VARCHAR(20),
    avatar_url      VARCHAR(500),
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason      VARCHAR(500),
    last_active     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── User Preferences ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender    VARCHAR(20),
    preferred_country   VARCHAR(3),
    theme               VARCHAR(10) NOT NULL DEFAULT 'dark',
    notifications       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Chat Sessions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id       UUID NOT NULL REFERENCES users(id),
    receiver_id     UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_time      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time        TIMESTAMP WITH TIME ZONE,
    duration_secs   INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID NOT NULL REFERENCES users(id),
    session_id      UUID REFERENCES chat_sessions(id),
    reason          VARCHAR(50) NOT NULL,
    description     VARCHAR(1000),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Blocked Users ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ─── Active Connections ──────────────────────────────────
CREATE TABLE IF NOT EXISTS active_connections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    socket_id       VARCHAR(100) NOT NULL,
    ip_address      VARCHAR(45),
    connected_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_ping       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Chat Messages (for persistence) ────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_caller ON chat_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_receiver ON chat_sessions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_active_connections_user ON active_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

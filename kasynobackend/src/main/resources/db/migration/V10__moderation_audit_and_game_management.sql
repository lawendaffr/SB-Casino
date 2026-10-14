ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP;
ALTER TABLE users ADD COLUMN email VARCHAR(254);
CREATE UNIQUE INDEX uq_users_email_lower ON users(lower(email)) WHERE email IS NOT NULL;
ALTER TABLE users ADD CONSTRAINT chk_user_account_status CHECK (account_status IN ('ACTIVE', 'BANNED'));

CREATE TABLE user_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reporter_username VARCHAR(50) NOT NULL,
    target_user_id BIGINT,
    target_username VARCHAR(50) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_reports_status_created ON user_reports(status, created_at DESC);

CREATE TABLE moderation_actions (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    target_user_id BIGINT NOT NULL,
    target_username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('WARNING', 'TIMEOUT', 'BAN', 'UNBAN')),
    reason VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_user_id, created_at DESC);

CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(80),
    details VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);

CREATE TABLE game_catalog (
    game_type VARCHAR(40) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_bet BIGINT NOT NULL CHECK (max_bet > 0),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO game_catalog(game_type, enabled, max_bet) VALUES ('BLACKJACK', TRUE, 1000000);

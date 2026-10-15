CREATE TABLE game_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    bet BIGINT NOT NULL CHECK (bet > 0),
    payout BIGINT NOT NULL DEFAULT 0 CHECK (payout >= 0),
    result VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    CONSTRAINT chk_game_records_status CHECK (status IN ('ACTIVE', 'COMPLETED')),
    CONSTRAINT chk_game_records_finished CHECK (
        (status = 'ACTIVE' AND finished_at IS NULL) OR
        (status = 'COMPLETED' AND finished_at IS NOT NULL)
    )
);

CREATE INDEX idx_game_records_user_created
    ON game_records(user_id, created_at DESC, id DESC);

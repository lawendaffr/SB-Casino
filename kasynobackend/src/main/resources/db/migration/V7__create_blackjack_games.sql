CREATE TABLE blackjack_games (
                                 id BIGSERIAL PRIMARY KEY,
                                 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 bet BIGINT NOT NULL CHECK (bet > 0),
                                 status VARCHAR(20) NOT NULL,
                                 player_cards TEXT NOT NULL,
                                 dealer_cards TEXT NOT NULL,
                                 remaining_deck TEXT NOT NULL,
                                 payout BIGINT NOT NULL DEFAULT 0,
                                 result VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 finished_at TIMESTAMP,

                                 CONSTRAINT chk_blackjack_status
                                     CHECK (status IN ('ACTIVE', 'FINISHED'))
);

CREATE INDEX idx_blackjack_games_user
    ON blackjack_games(user_id, created_at DESC);
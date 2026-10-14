ALTER TABLE blackjack_games
    ADD COLUMN game_record_id BIGINT UNIQUE REFERENCES game_records(id) ON DELETE SET NULL;

CREATE INDEX idx_blackjack_games_game_record
    ON blackjack_games(game_record_id);

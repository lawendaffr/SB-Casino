CREATE TABLE transactions (
                              id BIGSERIAL PRIMARY KEY,

                              user_id BIGINT NOT NULL,

                              type VARCHAR(30) NOT NULL,

                              amount BIGINT NOT NULL CHECK (amount > 0),

                              balance_before BIGINT NOT NULL,

                              balance_after BIGINT NOT NULL,

                              description VARCHAR(255),

                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_transactions_user
                                  FOREIGN KEY (user_id)
                                      REFERENCES users(id)
                                      ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user_created_at
    ON transactions(user_id, created_at DESC);
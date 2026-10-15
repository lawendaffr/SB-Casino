CREATE TABLE deposit_codes (
    id BIGSERIAL PRIMARY KEY,
    CODE varchar(32) not null unique,
    amount bigint NOT NULL CHECK ( amount > 0 ),
    redemption_policy VARCHAR(30) NOT NULL
                           CHECK ( redemption_policy IN     (
                               'ONCE_TOTAL',
                                'ONCE_PER_USER',
                                'LIMITED_USES'
                            )),
    max_uses BIGINT,
    expires_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_deposit_code_policy_limit
        CHECK (
            (redemption_policy = 'ONCE_TOTAL'
                AND (max_uses IS NULL OR max_uses = 1))
                OR
            (redemption_policy = 'ONCE_PER_USER')
                OR
            (redemption_policy = 'LIMITED_USES'
                AND max_uses IS NOT NULL)
            )
);

CREATE TABLE deposit_code_redemptions (
                                          id BIGSERIAL PRIMARY KEY,
                                          deposit_code_id BIGINT NOT NULL,
                                          user_id BIGINT NOT NULL,
                                          redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                          CONSTRAINT fk_redemptions_code
                                              FOREIGN KEY (deposit_code_id)
                                                  REFERENCES deposit_codes(id)
                                                  ON DELETE CASCADE,

                                          CONSTRAINT fk_redemptions_user
                                              FOREIGN KEY (user_id)
                                                  REFERENCES users(id)
                                                  ON DELETE CASCADE,

                                          CONSTRAINT uq_code_redemption
                                              UNIQUE (deposit_code_id, user_id)
);

CREATE INDEX idx_redemptions_user
    ON deposit_code_redemptions(user_id, redeemed_at DESC);
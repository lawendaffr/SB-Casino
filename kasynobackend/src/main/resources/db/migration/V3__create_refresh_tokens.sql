CREATE TABLE refresh_tokens(
  id BIGSERIAL PRIMARY KEY ,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE ,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_refresh_tokens_user
                           FOREIGN KEY (user_id)
                           REFERENCES users(id)
                           ON DELETE CASCADE
);
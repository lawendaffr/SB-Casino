CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    actor_username VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('WARNING', 'NEWS', 'SYSTEM', 'BALANCE')),
    title VARCHAR(140) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_target_created ON notifications(target_user_id, created_at DESC);

CREATE TABLE notification_reads (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notification_read UNIQUE (notification_id, user_id)
);

CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);

INSERT INTO notifications (target_user_id, actor_username, category, title, message, created_at)
SELECT
    ma.target_user_id,
    ma.actor_username,
    'WARNING',
    'Moderator Warning',
    COALESCE(ma.reason, 'Please follow casino community rules.'),
    ma.created_at
FROM moderation_actions ma
WHERE ma.action = 'WARNING'
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ma.target_user_id);

INSERT INTO notifications (target_user_id, actor_username, category, title, message)
VALUES (
    NULL,
    'SB-Casino',
    'NEWS',
    'Welcome to SB-Casino!',
    'Check out Blackjack in the Lobby and redeem giftcodes on the Redeem Credits page.'
);


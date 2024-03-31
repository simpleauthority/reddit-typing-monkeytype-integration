-- Migration number: 0001 	 2024-03-31T03:20:04.474Z
CREATE TABLE user (
    id VARCHAR(255) PRIMARY KEY
);

CREATE TABLE user_session (
    id VARCHAR(255) PRIMARY KEY,
    expires_at DATETIME NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES user(id)
);
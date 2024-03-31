-- Migration number: 0002 	 2024-03-31T04:58:18.303Z
ALTER TABLE user ADD COLUMN reddit_username VARCHAR(255) NOT NULL;
ALTER TABLE user ADD COLUMN monkeytype_apekey VARCHAR(255);
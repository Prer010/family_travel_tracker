CREATE TABLE accounts(
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(255), -- Nullable for OAuth users
auth_provider VARCHAR(50) DEFAULT 'local', -- 'local' or 'google'
google_id VARCHAR(255), -- Google user ID
profile_picture VARCHAR(500), -- Profile picture URL from OAuth
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users(
id SERIAL PRIMARY KEY,
name VARCHAR(15) UNIQUE NOT NULL,
color VARCHAR(15),
account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE visited_countries(
id SERIAL PRIMARY KEY,
country_code CHAR(2) NOT NULL,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
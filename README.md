# Travel Tracker App

A family travel tracking application with user authentication where families can track countries they've visited on an interactive world map.

## Features

- 🔐 User authentication (signup/login)
- 👨‍👩‍👧‍👦 Family member management
- 🌍 Interactive world map
- 📍 Country tracking per family member
- 🎨 Customizable colors for each family member

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- A database named 'world' with countries data

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your PostgreSQL database:
   - Create a database named 'world'
   - Import the countries data (you'll need a countries table with country_name and country_code columns)
   - Run the SQL commands from `queries.sql` to create the required tables

4. Configure environment variables:
   - Copy `.env.example` to `.env` (or update the existing `.env`)
   - Update the database connection details:
     ```
     USER=your_postgres_username
     HOST=localhost
     DATABASE=world
     PASSWORD=your_postgres_password
     PORT=5432
     SESSION_SECRET=your-super-secret-session-key-change-this-in-production
     ```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Database Setup

Run the following SQL commands to set up your database:

```sql
-- Create accounts table for authentication
CREATE TABLE accounts(
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for family members
CREATE TABLE users(
id SERIAL PRIMARY KEY,
name VARCHAR(15) UNIQUE NOT NULL,
color VARCHAR(15),
account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create visited countries table
CREATE TABLE visited_countries(
id SERIAL PRIMARY KEY,
country_code CHAR(2) NOT NULL,
user_id INTEGER REFERENCES users(id)
);
```

## Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `USER` - PostgreSQL username
- `HOST` - PostgreSQL host
- `DATABASE` - Database name
- `PASSWORD` - PostgreSQL password  
- `PORT` - PostgreSQL port (usually 5432)
- `SESSION_SECRET` - A secure random string for session encryption

### Deployment Platforms

#### Heroku
1. Create a Heroku app
2. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:hobby-dev`
3. Set environment variables in Heroku dashboard
4. Deploy: `git push heroku main`

#### Railway
1. Connect your GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically on push

#### DigitalOcean App Platform
1. Create a new app from GitHub
2. Add a managed PostgreSQL database
3. Configure environment variables
4. Deploy

## Usage

1. Visit the landing page
2. Sign up for a new account or login
3. Add family members with custom colors
4. Start tracking countries you've visited
5. Switch between family members to see their individual travel maps

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Protected routes
- SQL injection prevention with parameterized queries

## License

ISC
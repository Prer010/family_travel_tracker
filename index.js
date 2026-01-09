import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import session from "express-session";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import mainRoutes from "./routes/main.js";

env.config();

const app = express();
const port = process.env.SERVER_PORT || 8080;

// Database connection for Supabase
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

db.connect()
  .then(() => console.log('Connected to Supabase PostgreSQL'))
  .catch(err => console.error('Database connection error:', err));

app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
configurePassport(db);

// Middleware to attach db to request object
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Mount routes
app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/', mainRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

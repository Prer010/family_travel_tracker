import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";

env.config(); // Load environment variables first

const app = express();
const port = process.env.SERVER_PORT || 8080;
const saltRounds = 10;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

let currentUserId = 1;

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session.accountId) {
    next();
  } else {
    res.redirect('/');
  }
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser(accountId) {
  const result = await db.query("SELECT * FROM users WHERE account_id = $1", [accountId]);
  return result.rows;
}

async function getCurrentAccount(accountId) {
  const result = await db.query("SELECT * FROM accounts WHERE id = $1", [accountId]);
  return result.rows[0];
}

// Landing page
app.get("/", async (req, res) => {
  if (req.session.accountId) {
    // User is logged in, redirect to dashboard
    res.redirect('/dashboard');
  } else {
    // Show landing page
    res.render("landing.ejs");
  }
});

// Login page
app.get("/login", (req, res) => {
  if (req.session.accountId) {
    res.redirect('/dashboard');
  } else {
    res.render("login.ejs");
  }
});

// Signup page
app.get("/signup", (req, res) => {
  if (req.session.accountId) {
    res.redirect('/dashboard');
  } else {
    res.render("signup.ejs");
  }
});

// Dashboard (main app)
app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const currentAccount = await getCurrentAccount(req.session.accountId);
    const usersResult = await db.query("SELECT * FROM users WHERE account_id = $1", [req.session.accountId]);
    const users = usersResult.rows;

    let countries = [];
    let currentUser = null;

    if (users.length > 0) {
      // If there's a current user ID in session, use it, otherwise use the first user
      const selectedUserId = req.session.currentUserId || users[0].id;
      currentUserId = selectedUserId;
      req.session.currentUserId = selectedUserId;

      currentUser = users.find(user => user.id == selectedUserId) || users[0];
      countries = await checkVisisted();
    }

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser?.color || 'teal',
      currentAccount: currentAccount
    });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

// Handle login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM accounts WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const account = result.rows[0];
      const valid = await bcrypt.compare(password, account.password);

      if (valid) {
        req.session.accountId = account.id;
        res.redirect('/dashboard');
      } else {
        res.render("login.ejs", { error: "Invalid email or password" });
      }
    } else {
      res.render("login.ejs", { error: "Invalid email or password" });
    }
  } catch (err) {
    console.log(err);
    res.render("login.ejs", { error: "An error occurred. Please try again." });
  }
});

// Handle signup
app.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("signup.ejs", { error: "Passwords do not match" });
  }

  try {
    // Check if email already exists
    const checkResult = await db.query("SELECT * FROM accounts WHERE email = $1", [email]);

    if (checkResult.rows.length > 0) {
      return res.render("signup.ejs", { error: "Email already registered" });
    }

    // Hash password and create account
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO accounts (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    const account = result.rows[0];
    req.session.accountId = account.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.log(err);
    res.render("signup.ejs", { error: "An error occurred. Please try again." });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
});

app.post("/add", requireAuth, async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    if (!data) {
      const countries = await checkVisisted();
      const currentAccount = await getCurrentAccount(req.session.accountId);
      const usersResult = await db.query("SELECT * FROM users WHERE account_id = $1", [req.session.accountId]);
      const users = usersResult.rows;
      const currentUser = users.find(user => user.id == currentUserId) || users[0];

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser?.color || 'teal',
        currentAccount: currentAccount,
        error: "Country name does not exist, try again."
      });
      return;
    }

    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/dashboard");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      const currentAccount = await getCurrentAccount(req.session.accountId);
      const usersResult = await db.query("SELECT * FROM users WHERE account_id = $1", [req.session.accountId]);
      const users = usersResult.rows;
      const currentUser = users.find(user => user.id == currentUserId) || users[0];

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser?.color || 'teal',
        currentAccount: currentAccount,
        error: "Country has already been added, try again."
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
});

app.post("/user", requireAuth, async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    req.session.currentUserId = currentUserId;
    res.redirect("/dashboard");
  }
});

app.post("/new", requireAuth, async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  try {
    const result = await db.query(
      "INSERT INTO users (name, color, account_id) VALUES($1, $2, $3) RETURNING *;",
      [name, color, req.session.accountId]
    );

    const id = result.rows[0].id;
    currentUserId = id;
    req.session.currentUserId = id;

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.render("new.ejs", { error: "Error creating family member. Name might already exist." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

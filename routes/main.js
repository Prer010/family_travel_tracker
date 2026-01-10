import express from "express";

const router = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session.accountId) {
        next();
    } else {
        res.redirect('/');
    }
}

// Helper functions
async function checkVisisted(userId, db) {
    const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1", [userId]);
    let countries = [];
    result.rows.forEach((country) => {
        countries.push(country.country_code);
    });
    return countries;
}

async function getCurrentUser(accountId, db) {
    const result = await db.query("SELECT * FROM users WHERE account_id = $1", [accountId]);
    return result.rows;
}

async function getCurrentAccount(accountId, db) {
    const result = await db.query("SELECT * FROM accounts WHERE id = $1", [accountId]);
    return result.rows[0];
}

// Landing page
router.get("/", async (req, res) => {
    if (req.session.accountId) {
        res.redirect('/dashboard');
    } else {
        res.render("landing.ejs");
    }
});

// Dashboard (main app)
router.get("/dashboard", requireAuth, async (req, res) => {
    try {
        const currentAccount = await getCurrentAccount(req.session.accountId, req.db);
        const usersResult = await req.db.query("SELECT * FROM users WHERE account_id = $1", [req.session.accountId]);
        const users = usersResult.rows;

        let countries = [];
        let currentUser = null;

        if (users.length > 0) {
            const selectedUserId = req.session.currentUserId || users[0].id;
            req.session.currentUserId = selectedUserId;

            currentUser = users.find(user => user.id == selectedUserId) || users[0];
            countries = await checkVisisted(selectedUserId, req.db);
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

// Add country
router.post("/add", requireAuth, async (req, res) => {
    const input = req.body["country"];
    const currentUserId = req.session.currentUserId;

    try {
        const result = await req.db.query(
            "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
            [input.toLowerCase()]
        );

        const data = result.rows[0];
        if (!data) {
            res.redirect("/dashboard?error=" + encodeURIComponent("Country name does not exist, try again."));
            return;
        }

        const countryCode = data.country_code;

        // Check if country already exists for this user
        const existingCountry = await req.db.query(
            "SELECT * FROM visited_countries WHERE country_code = $1 AND user_id = $2",
            [countryCode, currentUserId]
        );

        if (existingCountry.rows.length > 0) {
            res.redirect("/dashboard?error=" + encodeURIComponent("Country has already been added, try again."));
            return;
        }

        // Insert the new country
        try {
            await req.db.query(
                "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
                [countryCode, currentUserId]
            );
            res.redirect("/dashboard");
        } catch (err) {
            console.log(err);
            res.redirect("/dashboard?error=" + encodeURIComponent("Error adding country. Please try again."));
        }
    } catch (err) {
        console.log(err);
        res.redirect("/dashboard");
    }
});

// Switch user or show new user form
router.post("/user", requireAuth, async (req, res) => {
    if (req.body.add === "new") {
        res.render("new.ejs");
    } else {
        req.session.currentUserId = req.body.user;
        res.redirect("/dashboard");
    }
});

// Create new family member
router.post("/new", requireAuth, async (req, res) => {
    const name = req.body.name;
    const color = req.body.color;

    try {
        const result = await req.db.query(
            "INSERT INTO users (name, color, account_id) VALUES($1, $2, $3) RETURNING *;",
            [name, color, req.session.accountId]
        );

        const id = result.rows[0].id;
        req.session.currentUserId = id;

        res.redirect("/dashboard");
    } catch (err) {
        console.log(err);
        res.render("new.ejs", { error: "Error creating family member. Name might already exist." });
    }
});

export default router;

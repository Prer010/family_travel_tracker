import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";

const router = express.Router();
const saltRounds = 10;

// Login page
router.get("/login", (req, res) => {
    if (req.session.accountId) {
        res.redirect('/dashboard');
    } else {
        res.render("login.ejs");
    }
});

// Signup page
router.get("/signup", (req, res) => {
    if (req.session.accountId) {
        res.redirect('/dashboard');
    } else {
        res.render("signup.ejs");
    }
});

// Handle login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await req.db.query("SELECT * FROM accounts WHERE email = $1", [email]);

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
router.post("/signup", async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render("signup.ejs", { error: "Passwords do not match" });
    }

    try {
        // Check if email already exists
        const checkResult = await req.db.query("SELECT * FROM accounts WHERE email = $1", [email]);

        if (checkResult.rows.length > 0) {
            return res.render("signup.ejs", { error: "Email already registered" });
        }

        // Hash password and create account
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await req.db.query(
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

// Google OAuth Routes
router.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        req.session.accountId = req.user.id;
        res.redirect("/dashboard");
    }
);

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

export default router;

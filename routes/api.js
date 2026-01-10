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

// Get user's visited countries
router.get("/user/:userId/countries", requireAuth, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Verify the user belongs to the current account
        const userCheck = await req.db.query("SELECT account_id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const result = await req.db.query(`
      SELECT vc.country_code, c.country_name 
      FROM visited_countries vc 
      JOIN countries c ON vc.country_code = c.country_code 
      WHERE vc.user_id = $1 
      ORDER BY c.country_name
    `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete individual country from user's visited list
router.delete("/user/:userId/countries/:countryCode", requireAuth, async (req, res) => {
    const userId = req.params.userId;
    const countryCode = req.params.countryCode;

    try {
        // Verify the user belongs to the current account
        const userCheck = await req.db.query("SELECT account_id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete the specific country
        await req.db.query(
            "DELETE FROM visited_countries WHERE user_id = $1 AND country_code = $2",
            [userId, countryCode]
        );

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update user's visited countries (remove countries)
router.patch("/user/:userId/countries", requireAuth, async (req, res) => {
    const userId = req.params.userId;
    const { deletedCountries } = req.body;

    try {
        // Verify the user belongs to the current account
        const userCheck = await req.db.query("SELECT account_id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete the specified countries
        if (deletedCountries && deletedCountries.length > 0) {
            const placeholders = deletedCountries.map((_, index) => `$${index + 2}`).join(',');
            await req.db.query(
                `DELETE FROM visited_countries WHERE user_id = $1 AND country_code IN (${placeholders})`,
                [userId, ...deletedCountries]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete family member
router.delete("/user/:userId", requireAuth, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Verify the user belongs to the current account
        const userCheck = await req.db.query("SELECT account_id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // First delete all visited countries for this user
        await req.db.query("DELETE FROM visited_countries WHERE user_id = $1", [userId]);

        // Then delete the user
        await req.db.query("DELETE FROM users WHERE id = $1", [userId]);

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Rename family member
router.patch("/user/:userId/rename", requireAuth, async (req, res) => {
    const userId = req.params.userId;
    const { newName } = req.body;

    try {
        // Verify the user belongs to the current account
        const userCheck = await req.db.query("SELECT account_id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Validate the new name
        if (!newName || newName.trim() === "") {
            return res.status(400).json({ success: false, message: "Name cannot be empty" });
        }

        // Update the user's name
        await req.db.query(
            "UPDATE users SET name = $1 WHERE id = $2",
            [newName.trim(), userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Search countries for autocomplete
router.get("/countries/search", requireAuth, async (req, res) => {
    const query = req.query.q || "";

    try {
        if (query.length < 1) {
            return res.json([]);
        }

        const result = await req.db.query(
            "SELECT country_name, country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ORDER BY country_name LIMIT 10",
            [query.toLowerCase()]
        );

        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete account and all associated data
router.delete("/account", requireAuth, async (req, res) => {
    const accountId = req.session.accountId;

    try {
        const usersResult = await req.db.query("SELECT id FROM users WHERE account_id = $1", [accountId]);
        const userIds = usersResult.rows.map(row => row.id);

        // Delete all visited countries for all users of this account
        if (userIds.length > 0) {
            const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
            await req.db.query(`DELETE FROM visited_countries WHERE user_id IN (${placeholders})`, userIds);
        }

        // Delete all users for this account
        await req.db.query("DELETE FROM users WHERE account_id = $1", [accountId]);

        await req.db.query("DELETE FROM accounts WHERE id = $1", [accountId]);

        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error destroying session" });
            }
            res.json({ success: true });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;

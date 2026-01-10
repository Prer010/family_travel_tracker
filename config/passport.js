import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export function configurePassport(db) {
    // Passport serialization
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await db.query("SELECT * FROM accounts WHERE id = $1", [id]);
            done(null, result.rows[0]);
        } catch (err) {
            done(err, null);
        }
    });

    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists by Google ID first
                let result = await db.query("SELECT * FROM accounts WHERE google_id = $1", [profile.id]);

                if (result.rows.length > 0) {
                    // User exists with this Google ID
                    return done(null, result.rows[0]);
                }

                // Check if user exists by email
                result = await db.query("SELECT * FROM accounts WHERE email = $1", [profile.emails[0].value]);

                if (result.rows.length > 0) {
                    // User exists with this email, link Google account
                    const updatedUser = await db.query(
                        "UPDATE accounts SET google_id = $1, auth_provider = 'google', profile_picture = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
                        [profile.id, profile.photos[0]?.value, result.rows[0].id]
                    );
                    return done(null, updatedUser.rows[0]);
                }

                // Create new user with Google OAuth
                const newUser = await db.query(
                    "INSERT INTO accounts (name, email, google_id, auth_provider, profile_picture) VALUES ($1, $2, $3, 'google', $4) RETURNING *",
                    [profile.displayName, profile.emails[0].value, profile.id, profile.photos[0]?.value]
                );
                return done(null, newUser.rows[0]);
            } catch (err) {
                return done(err, null);
            }
        }
    ));
}

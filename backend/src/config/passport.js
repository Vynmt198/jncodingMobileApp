const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const avatar = profile.photos?.[0]?.value;
                const fullName = profile.displayName;
                const googleId = profile.id;

                let user = await User.findOne({ googleId });
                if (user) {
                    return done(null, user);
                }

                user = await User.findOne({ email });
                if (user) {
                    user.googleId = googleId;
                    if (!user.avatar) user.avatar = avatar;
                    await user.save();
                    return done(null, user);
                }

                user = await User.create({
                    googleId,
                    email,
                    fullName,
                    avatar,
                    password: require('crypto').randomBytes(32).toString('hex'),
                    role: 'learner',
                });

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, id));

module.exports = passport;

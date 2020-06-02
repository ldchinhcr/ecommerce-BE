const passport = require('passport-google-oauth2');
const GGStrategy = passport.Strategy;
const User = require('../models/user');

module.exports = (new GGStrategy({
    clientID:     process.env.GG_ID,
    clientSecret: process.env.GG_SECRET,
    callbackURL: process.env.DOMAIN + process.env.GG_CB,
    scope: ["profile","email"],
    passReqToCallback   : true
},
    async function(request, accessToken, refreshToken, profile, cb) {
    const {name, email} = profile._json
    const user = await User.findOneOrCreate({name, email})
    cb(null, user);
    }
))

const passport = require('passport-facebook');
const FacebookStrategy = passport.Strategy;
const User = require('../models/user');

module.exports = new FacebookStrategy(
  {
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL: process.env.DOMAIN + process.env.FB_CB,
    profileFields: ['id', 'displayName', 'photos', 'email'],
    enableProof: true
  },
  async function (accessToken, refreshToken, profile, cb) {
    const {email, name} = profile._json;
    const user = await User.findOneOrCreate({name, email})
    cb(null, user);
  }
);

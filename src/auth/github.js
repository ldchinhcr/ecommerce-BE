const passport = require('passport-github2');
const GithubStrategy = passport.Strategy;
const User = require('../models/user');

module.exports = new GithubStrategy(
  {
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: process.env.DOMAIN + process.env.GITHUB_CB,
    scope: ['user:email']
  },
  async function (accessToken, refreshToken, profile, cb) {
    const userToCreate = {name: profile.username, email: profile.emails[0].value}
    const user = await User.findOneOrCreate(userToCreate)
      cb(null, user);
  }
);

const passport = require('passport');
const FacebookStrategy = require('./facebook');
const GGStrategy = require('./google');
const GithubStrategy = require('./github');


passport.use(FacebookStrategy);
passport.use(GGStrategy);
passport.use(GithubStrategy);



module.exports = passport;
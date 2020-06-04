const passport = require("passport");

exports.loginGG = passport.authenticate("google");

exports.ggAuth = function(req, res, next) {
    passport.authenticate("google", function(err, user) {
      if (err) return res.redirect(`${process.env.CLIENT_DOMAIN}`)
      return res.redirect(`${process.env.CLIENT_DOMAIN}/?token=${user.token[user.token.length-1]}&&refreshToken=${user.refreshToken[user.refreshToken.length-1]}`)
    })(req, res, next);
  };

const passport = require("passport");

exports.loginFacebook = passport.authenticate("facebook", { scope: [ 'email' ] });

exports.facebookAuth = function(req, res, next) {
    passport.authenticate("facebook", function(err, user) {
      if (err) return res.redirect(`${process.env.CLIENT_DOMAIN}`)
      return res.redirect(`${process.env.CLIENT_DOMAIN}/?token=${user.token[user.token.length-1]}&&refreshToken=${user.refreshToken[user.refreshToken.length-1]}`)
    })(req, res, next);
  };



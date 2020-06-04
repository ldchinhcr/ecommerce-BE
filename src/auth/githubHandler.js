const passport = require("passport");

exports.loginGithub = passport.authenticate("github", { scope: [ 'user','user:email' ] });

exports.githubAuth = function(req, res, next) {
    passport.authenticate("github", async function(err, user) {
      if (err) return res.redirect(`${process.env.CLIENT_DOMAIN}`)
      return res.redirect(`${process.env.CLIENT_DOMAIN}/?token=${user.token[user.token.length-1]}&&refreshToken=${user.refreshToken[user.refreshToken.length-1]}`)
    })(req, res, next);
  };



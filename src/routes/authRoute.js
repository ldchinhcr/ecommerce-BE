const {loginFacebook, facebookAuth} = require('../auth/fbHandler');
const {loginGG, ggAuth} = require('../auth/ggHandler');
const {loginGithub, githubAuth} = require('../auth/githubHandler');
const {auth, login, logoutall, logout, refreshNewAccessToken} = require('../controllers/authController');

const router = require('express').Router();

router.get("/facebook", loginFacebook);
router.get("/facebook/authorized", facebookAuth);

router.get("/google", loginGG);
router.get("/google/authorized", ggAuth);

router.get("/github", loginGithub);
router.get("/github/authorized", githubAuth);

router.post('/login', login);

router.post('/logout', auth, logout);

router.get('/logoutall', auth , logoutall);

router.post('/refresh-token', refreshNewAccessToken);

module.exports = router;
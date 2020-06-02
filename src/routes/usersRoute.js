const {
  forgotPassword,
  resetPassword,
  verifyAccount,
  createVerifyToken,
} = require("../controllers/verifyController");
const { getUser, createUser, updateProfile, updatePasswords } = require("../controllers/userController");
const { auth } = require("../controllers/authController");

const router = require("express").Router();

router.put("/verifyaccount", verifyAccount);

router.get("/generateverify", auth, createVerifyToken);

router.post("/forgotpassword", forgotPassword);

router.put("/resetpassword", resetPassword);

router.route("/me")
.get(auth, getUser)
.put(auth, updateProfile);

router.put("/updatepassword", auth, updatePasswords);

router.route("/")
.post(createUser);

module.exports = router;

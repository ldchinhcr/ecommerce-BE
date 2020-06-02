const { auth } = require("../controllers/authController");
const router = require("express").Router({ mergeParams: true });
const {createOrder} = require("../controllers/orderController");

router.route('/')
.post(auth, createOrder)


module.exports = router;
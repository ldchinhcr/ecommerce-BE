const router = require('express').Router({mergeParams: true});
const { auth } = require("../controllers/authController");
const {createOrder} = require("../controllers/orderController");
const {readCart, createCart, updateCart, deleteCart, readCartPopulated, updateCartPopulated, deleteProductInCart} = require('../controllers/cartController');

router.put('/delproducts', auth, deleteProductInCart);

router.post('/checkout', auth, createOrder);

router.route('/populated')
.get(auth, readCartPopulated)
.put(auth, updateCartPopulated);

router.route('/')
.get(auth, readCart)
.post(auth, createCart)
.put(auth, updateCart)
.delete(auth, deleteCart);

module.exports = router;
const {getCats, getSingleCat, createCat, deleteCat, updateCat} = require('../controllers/catController');
const {auth} = require('../controllers/authController');
const {getProductsByCategory, getAllProductsIncludeEmptyList} = require('../controllers/productsController');
const router = require('express').Router({mergeParams: true});

router.route('/:cslug')
.get(getProductsByCategory)
.put(auth, updateCat)
.delete(auth, deleteCat);

router.get('/:cslug/alllist', getAllProductsIncludeEmptyList);

router.route('/')
.get(getCats)
.post(auth, createCat);

module.exports = router;


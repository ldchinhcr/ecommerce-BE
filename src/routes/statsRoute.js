const router = require("express").Router({ mergeParams: true });
const {
    aliasTopRating,
    getProducts,
  } = require("../controllers/productsController");

router.route("/top8rating").get(aliasTopRating, getProducts);

router.route("/products").get(getProducts);

module.exports = router;
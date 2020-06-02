const { auth } = require("../controllers/authController");
const router = require("express").Router({ mergeParams: true });
const {
  createProducts,
  chooseProduct,
  createDetailProduct,
  updateProducts,
  updateDetailProduct,
  getSingleProduct,
  deleteDetailProduct,
  deleteProducts,
} = require("../controllers/productsController");

router.route("/").post(auth, createProducts);

router.get("/:pslug/:dpslug", getSingleProduct);

router.route("/:pId/:dpId")
  .put(auth, updateDetailProduct)
  .delete(auth, deleteDetailProduct);

router
  .route("/:pslug")
  .get(chooseProduct)
  .post(auth, createDetailProduct);

router.route("/:pId")
.put(auth, updateProducts)
.delete(auth, deleteProducts);


module.exports = router;
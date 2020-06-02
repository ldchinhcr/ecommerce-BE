const { auth } = require("../controllers/authController");
const router = require("express").Router({ mergeParams: true });
const {
  createReview,
  updateReview,
  getReviews,
  getReview,
  deleteReview,
} = require("../controllers/reviewController");

router.route('/')
.get(getReviews)
.post(auth, createReview);

router.route('/:rId')
.get(getReview)
.put(auth, updateReview)
.delete(auth, deleteReview);

module.exports = router;


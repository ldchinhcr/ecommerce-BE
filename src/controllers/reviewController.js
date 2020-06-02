const Review = require("../models/review");
const ListProducts = require("../models/listProducts");
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {updateOne, deleteOne, createOne} = require('../utils/operateHandler');
const {slugToId} = require("../utils/operateHandler");

exports.createReview = createOne(Review);

exports.updateReview = updateOne(Review);

exports.getReviews = catchAsync(async function (req, res, next) {
    const productId = await slugToId(req.params.pslug, ListProducts)
    const product = await ListProducts.findById(productId)
      .populate({
        path: "reviews",
        select: "-createdAt -updatedAt -__v",
      })
      .populate("type", "type slug")
      .populate("createdBy", "_id email name");
      if (!product) {
        return next(new AppError('No product or reviews found with that ID', 404));
      }
    const countReviews = await Review.find().countDocuments();
    res.status(200).json({ status: true, data: product , totalReviews: countReviews});
});

exports.getReview = catchAsync(async function (req, res, next) {
    const review = await Review.findById(req.params.rId)
      .populate("product", "_id name slug ratingsAverage ratingsQuantity")
      .populate("createdBy", "_id email name")
      .populate({
        path: "type",
        select: "-createdAt -updatedAt -__v",
      });
      if (!review) {
        return next(new AppError('No review found with that ID', 404));
      }
    res.status(200).json({ status: true, review: review });
});

exports.deleteReview = deleteOne(Review);

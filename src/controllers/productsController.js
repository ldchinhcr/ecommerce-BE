const ListProducts = require("../models/listProducts");
const Product = require("../models/product");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { updateOne, deleteOne, createOne } = require("../utils/operateHandler");
const Review = require("../models/review");
const {slugToId} = require("../utils/operateHandler");
const Category = require("../models/category");

exports.aliasTopRating = (req, res, next) => {
  req.query.limit = "8";
  req.query.sort = "ratingsAverage,ratingQuantity";
  req.query.fields = "name, price, imageCover, type, slug";
  next();
};

const filterObj = (obj, ...notAllowed) => {
  Object.keys(obj).forEach((el) => {
    if (notAllowed.includes(el)) delete obj[el];
  });
  return obj;
};

exports.createProducts = createOne(ListProducts);

exports.createDetailProduct = createOne(Product);

exports.updateProducts = updateOne(ListProducts);

exports.updateDetailProduct = updateOne(Product);

exports.getAllProductsIncludeEmptyList = catchAsync(async function (req, res, next) {
  const id = await slugToId(req.params.cslug, Category)

  const products = await ListProducts.find({type: id}).select("name slug");

  if (products.length === 0) {
    return next(new AppError("Nothing to show!", 404));
  }
  res
    .status(200)
    .json({ status: true, products: products });
});

exports.getProductsByCategory = catchAsync(async function (req, res, next) {
  const id = await slugToId(req.params.cslug, Category)
  const queryObj = {...req.query, type: id, list: {$ne: []}}
  const features = new APIFeatures(
    ListProducts.find(),
    queryObj
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;

  const featuresCount = new APIFeatures(ListProducts.find(), filterObj(queryObj, "page", "limit"))
  .filter()
  .sort()
  .limitFields()
  .paginate();
  const totalProducts = await featuresCount.query;
  if (products.length === 0) {
    return next(new AppError("Nothing to show!", 404));
  }
  res
    .status(200)
    .json({ status: true, products: products, totalProducts: totalProducts.length });
});

exports.chooseProduct = catchAsync(async function (req, res, next) {
  const Productid = await slugToId(req.params.pslug, ListProducts)
  const product = await ListProducts.findById(Productid)
  .populate({
    path: "reviewers",
    select: "_id content rating createdAt",
  });
  if (!product) {
    return next(new AppError("This product doesn't have specific product color!", 403));
  }
  res.status(200).json({ status: true, data: product });
});

exports.getProducts = catchAsync(async function (req, res, next) {
  const queryObj = {...req.query, list: {$ne: []}}
  const features = new APIFeatures(ListProducts.find().populate("type"), queryObj)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;

  if (products.length === 0) {
    return next(new AppError("Nothing to show!", 404));
  }

  const featuresCount = new APIFeatures(ListProducts.find({}), filterObj(queryObj, "page", "limit"))
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const totalProducts = await featuresCount.query;

  res
    .status(200)
    .json({ status: true, products: products, totalProducts: totalProducts.length });
});

exports.getSingleProduct = catchAsync(async function (req, res, next) {
  const ListProductid = await slugToId(req.params.pslug, ListProducts)
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const skip = (page - 1) * limit;
  const product = await Product.findOne({slug: req.params.dpslug, product: ListProductid})
    .populate("createdBy", "_id email name")
    .populate("product", "-__v -createdAt -updatedAt -list")
    .populate({path: "allReview", select: "-__v", options: {skip: skip, limit: limit}});
  const countReviews = await Review.findOne({product: product.product}).countDocuments();
  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }
  res.status(200).json({ status: true, data: product, totalReviews: countReviews});
});

exports.deleteProducts = deleteOne(ListProducts);

exports.deleteDetailProduct = deleteOne(Product);

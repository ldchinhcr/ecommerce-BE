const Category = require("../models/category");
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {updateOne, deleteOne, createOne} = require('../utils/operateHandler');

exports.createCat = createOne(Category);

exports.getCats = catchAsync( async function (req, res, next) {
  const page = req.query.page || 1;
  const limit = req.query.limit || 4;
  const skip = (page - 1) * limit;
  const cats = await Category.find().populate({path: "allProducts", select: "-__v -createdAt -updatedAt", options: {skip: skip, limit: limit}});
  if (cats.length === 0) {
    return next(new AppError('No categories found', 404));
  }
  res.status(200).json({ status: true, categories: cats });
});

exports.getSingleCat = catchAsync( async function (req, res, next) {
  const cat = await Category.findOne({slug: req.params.cslug}).populate("allProducts")
  if (!cat) {
  return next(new AppError('No category found with that ID', 404));
}
res.status(200).json({ status: true, data: cat });
});

exports.deleteCat = deleteOne(Category);

exports.updateCat = updateOne(Category);

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Cart = require("../models/cart");
const Product = require("../models/product");
const { deleteOne } = require("../utils/operateHandler");

exports.readCart = catchAsync(async function (req, res, next) {
  const cart = await Cart.findOne({ createdBy: req.user._id });
  if (!cart) {
    return next(
      new AppError("This account doesn't have any products in its cart.", 404)
    );
  }
  res.status(200).json({ status: true, data: cart });
});

exports.readCartPopulated = catchAsync(async function (req, res, next) {
  const cart = await Cart.findOne({ createdBy: req.user._id })
    .populate("products.product")
    .populate("products.color");
  if (!cart) {
    return next(
      new AppError("This account doesn't have any products in its cart.", 404)
    );
  }
  res.status(200).json({ status: true, data: cart });
});

exports.updateCartPopulated = catchAsync(async function (req, res, next) {
  const cart = await Cart.findOneAndUpdate(
    { createdBy: req.user._id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("products.product")
    .populate("products.color");
  res.status(200).json({ status: true, data: cart });
});

exports.createCart = catchAsync(async function (req, res, next) {
  let product = await Product.findById(req.body.color);
  if (req.body.quantity > product.availability) {
    return next(new AppError('Over Availability', 400))
  }
  let cart = await Cart.findOne({ createdBy: req.user._id });
  if (!cart) {
    cart = await Cart.create({ products: [req.body], createdBy: req.user._id });
  } else {
    const index = cart.products.findIndex((el) => el.color.toString() === req.body.color);
    if (index === -1) {
      cart.products = [...cart.products, req.body];
    } else {
      cart.products[index].quantity =
        cart.products[index].quantity + req.body.quantity;
    }
    await cart.save({ validateBeforeSave: false });
  }
  res.status(200).json({ status: true, data: cart });
});

exports.updateCart = catchAsync(async function (req, res, next) {
    let product = await Product.findById(req.body.color);
    if (req.body.quantity > product.availability) {
      return next(new AppError('Over Availability', 400))
    }
    let cart = await Cart.findOne({ createdBy: req.user._id });
    const index = cart.products.findIndex((el) => el.color.toString() === req.body.color);
    cart.products[index].quantity = req.body.quantity;
    await cart.save({ validateBeforeSave: false });
    res.status(200).json({ status: true, data: cart });
});

exports.deleteProductInCart = catchAsync(async function (req, res, next) {
  let cart = await Cart.findOneAndUpdate({ createdBy: req.user._id }, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ status: true, data: cart });
});

exports.deleteCart = deleteOne(Cart);

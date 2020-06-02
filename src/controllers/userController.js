const bcrypt = require("bcrypt");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { updateOne, createOne } = require("../utils/operateHandler");

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({ path: "listInSelling", select: "type product color availability slug", populate: {path: "product", select: "_id name price priceDiscount slug imageCover"}})
    .populate({ path: "listSold", select: "-__v -createdAt -updatedAt", populate: {path: "products.color", select: "product color slug _id", populate: {path: "product", select: "name slug _id -type -list"}}})
    .populate({ path: "listPurchased", select: "-__v -createdAt -updatedAt", populate: {path: "products.color", select: "product color slug _id", populate: {path: "product", select: "name slug _id -type -list"}}});
  if (!user) {
    return next(new AppError("No User with that such ID!", 404));
  }
  res.status(200).json({ status: true, data: user });
});

exports.allUser = catchAsync(async function (req, res, next) {
  const users = await User.find();
  res.status(200).json({ status: true, data: users });
});

exports.createUser = createOne(User);

exports.updatePasswords = catchAsync(async function (req, res, next) {
  const user = req.user;
  if (req.body) {
    if (!req.user.socialsOAuth) {
      const verifiedPassword = await bcrypt.compare(
        req.body.currentPassword.toString(),
        user.password
      );
      if (!verifiedPassword) {
        return next(new AppError("Invalid current password", 400));
      }
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.socialsOAuth = false;
    await user.save();
    res.status(200).json({
      status: true,
      message: "User updated successfully.",
    });
  } else {
    return next(
      new AppError(
        "Please provide some information to change your account",
        400
      )
    );
  }
});

exports.updateProfile = updateOne(User);

exports.changeRolesAdmin = catchAsync(async function (req, res, next) {
  if (req.user.roles === "admin") {
    const user = await User.findByIdAndUpdate(req.params.id, {
      roles: "admin",
    });
    if (!user) {
      return next(new AppError("No User with that such ID!", 404));
    }
    res
      .status(200)
      .json({ status: true, message: "User's roles updated successfully." });
  } else {
    return next(new AppError("Unauthorized to perform this action", 403));
  }
});

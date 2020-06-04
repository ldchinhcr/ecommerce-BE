const catchAsync = require("./catchAsync");
const AppError = require("./appError");
const User = require("../models/user");
const sendEmail = require("./email");
const Category = require("../models/category");
const Product = require("../models/product");
const ListProducts = require("../models/listProducts");
const verifyHTMLForm = require("../assets/verify");
const Cart = require("../models/cart");
const slugify = require("slugify");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const sendVerification = async (user, res, next) => {
  const verifyToken = await user.createVerifyToken();

  const verifyURL = `${process.env.CLIENT_DOMAIN}/verifyaccount/?verifytoken=${verifyToken}`;

  const link = `${process.env.CLIENT_DOMAIN}/login`;
  const namebutton = "Login";
  const msg = `To successfully verify your account please click this link: ${verifyURL}  .\n Thank you!`;
  const html = verifyHTMLForm(msg, namebutton, link);
  try {
    await sendEmail({
      email: user.email,
      subject: "Please verify your account (valid for 60 mins)",
      html,
    });

    res.status(200).json({
      status: true,
      message: "Verify token sent to email",
      data: user,
    });
  } catch (err) {
    user.verifyToken = undefined;
    user.verifyExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err.message);
    return next(
      new AppError(
        "There was an error when trying to send the email. Try again later!",
        500
      )
    );
  }
};

const ownerCheck = async function (user, Model, id) {
  try {
    const item = await Model.findById(id);
    if (!item) {
      throw new AppError("That ID not exists in our db", 404);
    }
    if (
      item.createdBy.toString() === user._id.toString() ||
      user.roles === "admin"
    ) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
  }
};

exports.slugToId = async function (slug, Model) {
  const item = await Model.findOne({ slug });
  return item._id;
};

const findIdBySlug = async function (slug, Model) {
  const item = await Model.findOne({ slug: slug });
  if (!item) {
    throw new AppError("Bad request, this url provided not correct", 400)
  }
  return item._id;
};

exports.createOne = (Model) =>
  catchAsync(async function (req, res, next) {
    let bodyData = {};
    let categoryId;
    let productId;
    switch (Model.modelName) {
      case "User":
        if (await User.findOne({ email: req.body.email })) {
          return next(new AppError("This email already in use!", 400));
        }
        bodyData = filterObj(
          req.body,
          "email",
          "name",
          "password",
          "passwordConfirm"
        );
        break;
      case "Category":
        bodyData = req.body;
        break;
      case "ListProducts":
        categoryId = await findIdBySlug(req.params.cslug, Category);
          bodyData = {
            ...req.body,
            type: categoryId,
            createdBy: req.user._id,
          };
        break;
      case "Product":
        categoryId = await findIdBySlug(req.params.cslug, Category);
        productId = await findIdBySlug(req.params.pslug, ListProducts);
        const checkColor = await Product.checkColors(productId, req.body.color);
        console.log(checkColor)
        if (!checkColor) {
          return next(
            new AppError("This color already storage with this product", 400)
          );
        }
        bodyData = {
          ...req.body,
          type: categoryId,
          product: productId,
          createdBy: req.user._id,
        };
        break;
      case "Review":
        categoryId = await findIdBySlug(req.params.cslug, Category);
        productId = await findIdBySlug(req.params.pslug, ListProducts);
        bodyData = {
          ...req.body,
          type: categoryId,
          product: productId,
          createdBy: req.user._id,
        };
        break;
      default:
        bodyData = { ...req.body };
    }
    const doc = await Model.create(bodyData);
    if (Model.modelName === "User" && doc.verified === false) {
      sendVerification(doc, res, next);
    } else {
      res.status(201).json({ status: true, data: doc });
    }
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let filteredBody = {};
    let id;
    let categoryId;
    switch (Model.modelName) {
      case "User":
        id = req.user._id;
        filteredBody = filterObj(
          req.body,
          "name",
          "email",
          "dob",
          "avatar",
          "gender",
          "socials"
        );
        break;
      case "Category":
        categoryId = await findIdBySlug(req.params.cslug, Category);
        if (await ownerCheck(req.user, Model, categoryId)) {
          id = categoryId;
          filteredBody = filterObj(req.body, "type");
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      case "ListProducts":
        if (await ownerCheck(req.user, Model, req.params.pId)) {
          id = req.params.pId;
          if (req.body.name) {
            filteredBody = {...req.body, slug: slugify(req.body.name, {lowercase: true}),};
          } else {
            filteredBody = req.body;
          }
          filteredBody = filterObj(
            filteredBody,
            "name",
            "imageCover",
            "slug",
            "price",
            "priceDiscount"
          );
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      case "Product":
        if (await ownerCheck(req.user, Model, req.params.dpId)) {
          id = req.params.dpId;
          if (req.body.color) {
            filteredBody = {...req.body, slug: slugify(req.body.color, {lowercase: true})};
          } else {
            filteredBody = req.body;
          }
          filteredBody = filterObj(
            filteredBody,
            "color",
            "images",
            "slug",
            "description",
            "inStock"
          );
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      case "Review":
        productId = await findIdBySlug(req.params.pslug, ListProducts);
        if (await ownerCheckReview(req.user, Model, req.params.rId)) {
          id = req.params.rId;
          filteredBody = req.body;
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      default:
        filteredBody = {};
    }
    let item;
    if (Model.modelName === "User") {
      item = await Model.findOneAndUpdate({ _id: id }, filteredBody, {
        new: true,
        runValidators: true,
      }).populate({ path: "listInSelling", select: "type product color availability slug", populate: {path: "product", select: "_id name price priceDiscount slug imageCover"}})
      .populate({ path: "listSold", select: "-__v -createdAt -updatedAt"})
      .populate({ path: "listPurchased", select: "-__v -createdAt -updatedAt"});
    } else {
      item = await Model.findOneAndUpdate({ _id: id }, filteredBody, {
        new: true,
        runValidators: true,
      })
    }
    res.status(200).json({ status: true, data: item });
  });

exports.deleteOne = (Model) =>
  catchAsync(async function (req, res, next) {
    let id;
    let categoryId;
    let productId;
    switch (Model.modelName) {
      case "Category":
        categoryId = await findIdBySlug(req.params.cslug, Category);
        if (await ownerCheck(req.user, Model, categoryId)) {
          id = categoryId;
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      case "ListProducts":
        if (await ownerCheck(req.user, Model, req.params.pId)) {
          id = productId;
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      case "Product":
        if (await ownerCheck(req.user, Model, req.params.dpId)) {
          id = req.params.dpId;
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
        case "Cart":
          const cart = await Cart.findOne({createdBy: req.user._id});
          if (await ownerCheck(req.user, Model, cart._id)) {
            id = cart._id;
          } else {
            return next(new AppError("Not authorized", 403));
          }
          break;
      case "Review":
        if (await ownerCheckReview(req.user, Model, req.params.rId)) {
          id = req.params.rId;
        } else {
          return next(new AppError("Not authorized", 403));
        }
        break;
      default:
        id;
    }
    await Model.findByIdAndDelete(id);
    res.status(204).end();
  });
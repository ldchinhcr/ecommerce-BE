const User = require("../models/user");
const Category = require("../models/category");
const Review = require("../models/review");
const Product = require("../models/product");
const ListProducts = require("../models/listProducts");
const AppError = require("./appError");
const {slugToId} = require("./operateHandler");


exports.roleCheck = async function(req,res, next) {
    const user = await User.findById(req.user.id)
    if (user && user.roles !== 'user'){
        next()
    } else{
        return next(new AppError('Forbidden', 403));
    }
}

exports.validateCategory = async function(req,res,next) {
    const cat = await Category.findOne({slug: req.params.cslug});
    if (cat) {
        req.cat = cat;
        next();
    } else {
        return next(new AppError("There's no such category!", 404));
    }
}


exports.validateProduct = async function(req,res,next) {
    const Productid = await slugToId(req.params.pslug, ListProducts)
    const product = await ListProducts.findById(Productid);
    if (product) {
        req.product = product;
        next();
    } else {
        return next(new AppError("There's no such product in our db!", 404));
    }
}

exports.validateDetailProduct = async function(req,res,next) {
    const Productid = await slugToId(req.params.pslug, ListProducts)
    const product = await Product.findOne({slug: req.params.dpslug, product: Productid});
    if (product) {
        req.product = product;
        next();
    } else {
        return next(new AppError("There's no such color for this product in our db!", 404));
    }
}

exports.validateReview = async function(req,res,next) {
    const review = await Review.findById(req.params.rId);
    if (review) {
        req.review = review;
        next();
    } else {
        return next(new AppError("There's no such review in our db!", 404));
    }
}
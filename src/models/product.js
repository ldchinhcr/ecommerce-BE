const mongoose = require("mongoose");
const ListProducts = require("./listProducts");
const slugify = require("slugify");
const User = require("./user");
const Review = require("./review");
const Order = require("./order");

const schema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListProducts",
      required: [true, "Product need a name from list product"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Product need a description"],
    },
    color: {
      type: String,
      required: [true, "Product need a color"],
      trim: true,
      lowercase: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product need a category"],
    },
    slug: String,
    inStock: {
      type: Number,
      required: [true, "A product mush have a quantity in stock."],
      min: [1, "Stock size must be greater than or equal to 1."],
    },
    availability: {
      type: Number,
      required: [true, "Availability is required."],
      default: 30,
      min: [0, "Availability must be greater or equal to 0."],
    },
    images: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

schema.virtual("allReview", {
  ref: "Review",
  localField: "product",
  foreignField: "product",
});

schema.methods.toJSON = function () {
  const Obj = this.toObject();
  delete Obj.createdAt;
  delete Obj.updatedAt;
  delete Obj.__v;
  return Obj;
};

schema.pre(/^findOneAndUpdate/, async function (next) {
  if (!this._update.inStock) next();
  const order = await Order.countOrder(this._conditions._id);
  this._update.availability = this._update.inStock - order;
  if (this._update.availability < 0) {
    next(new AppError("Order exceeds availability in stock", 400));
  }
  next();
});

schema.statics.checkColors = async function (id, color) {
  const product = await Product.findOne({ product: id, color: color });
  if (product) {
    return false;
  }
  return true;
};

schema.pre("save", function (next) {
  this.slug = slugify(this.color, { lower: true });
  next();
});

schema.pre("save", async function (next) {
  if (!this.isModified("inStock")) next();

  const order = await Order.countOrder(this._id);
  this.availability = this.inStock - order;

  if (this.availability < 0) {
    next(new AppError("Order exceeds availability in stock", 400));
  }
  next();
});

schema.pre("save", async function (next) {
  if (this.isModified("availability") && !this.isNew) return next();
  const thisProduct = await ListProducts.findOne({ _id: this.product });
  thisProduct.list.push(this._id);
  await thisProduct.save();

  const thisUser = await User.findOne({ _id: this.createdBy });
  thisUser.listInSelling.push(this._id);
  await thisUser.save({validateBeforeSave: false});
  next();
});

schema.pre(/^find/, async function (next) {
  this.populate("type", "-__v -createdAt -updatedAt")
  next();
});


schema.post("findOneAndDelete", async function () {
  const thisUser = await User.findOne({ listInSelling: {$in : [this._conditions._id]} });
  const index = thisUser.listInSelling.findIndex(id => id.toString() === this._conditions._id.toString());
  if (index !== -1) {
    thisUser.listInSelling.splice(index, 1);
    await thisUser.save({ validateBeforeSave: false });
  }
})

schema.post("findOneAndDelete", async function () {
  const thisProduct = await ListProducts.findOne({ list: {$in: [this._conditions._id]}});
  console.log(thisProduct)
  const index = thisProduct.list.findIndex(el => el._id.toString() === this._conditions._id.toString());
  if (index !== -1) {
  thisProduct.list.splice(index, 1);
  await thisProduct.save({ validateBeforeSave: false });
  }
})

const Product = mongoose.model("Product", schema);

module.exports = Product;

const mongoose = require("mongoose");
const slugify = require("slugify");
const Product = require("./product");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name of product is required!"],
      trim: true,
      unique: true,
      maxlength: [
        40,
        "A name of product must have less or equal then 40 characters",
      ],
      minlength: [
        4,
        "A name of product must have greater or equal then 10 characters",
      ],
    },
    imageCover: {
      type: String,
      required: [true, "A product must have a cover image"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    slug: String,
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    list: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    price: {
      type: Number,
      required: [true, "Price is required."],
      trim: true,
    },
    priceDiscount: {
      type: Number,
      min: 0,
      max: 100
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
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

schema.virtual("reviewers", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

schema.methods.toJSON = function () {
  const Obj = this.toObject();
  delete Obj.createdAt;
  delete Obj.updatedAt;
  delete Obj.__v;
  return Obj;
};

schema.pre(/^find/, async function (next) {
  this.find({"list": {$ne: []}});
  next();
});

schema.pre(/^find/, async function (next) {
  this.populate("list", "-__v -createdAt -updatedAt").populate(
    "type",
    "-__v -createdAt -updatedAt"
  );
  next();
});

schema.pre("save", async function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

schema.post("findOneAndDelete", async function () {
  await Product.deleteMany({ product: this._conditions._id });
});

schema.post("findOneAndDelete", async function () {
  await Review.deleteMany({ product: this._conditions._id });
});

const ListProducts = mongoose.model("ListProducts", schema);

module.exports = ListProducts;

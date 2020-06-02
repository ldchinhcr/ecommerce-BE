const mongoose = require("mongoose");
const slugify = require("slugify");

const schema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["suitcase", "bag", "accessories"],
      required: [true, "Category need a type!"],
      unique: true
    },
    slug: {
      type: String,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

schema.virtual('allProducts', {
  ref: "ListProducts",
  localField: "_id",
  foreignField: "type"
})

schema.pre('save', function(next) {
  this.slug = slugify(this.type, { lower: true });
  next();
});

const Category = mongoose.model("Category", schema);

module.exports = Category;

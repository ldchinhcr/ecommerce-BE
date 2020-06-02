const mongoose = require('mongoose');

const schema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ListProducts',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Content is required.'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required.'],
        trim: true,
        min: 0,
        max: 5
    },
    type: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true}
});

schema.methods.toJSON = function () {
    const Obj = this.toObject();
    delete Obj.createdAt;
    delete Obj.updatedAt;
    delete Obj.__v;
    return Obj;
  };
  
  schema.statics.calculateAvgRating = async function(productId) {
      const stats = await this.aggregate([
          {$match: { product: productId }},
          {$group: {
              _id: "$product",
              ratingQuantity: { $sum: 1 },
              avgRating: { $avg: "$rating" },
            }}
        ])

    await mongoose.model('ListProducts').findByIdAndUpdate(productId, {
        ratingsAverage: stats.length === 0 ? 4.5 : stats[0].avgRating,
        ratingsQuantity: stats.length === 0 ? 0 : stats[0].ratingQuantity
    });
};

// schema.index({product: 1, createdBy: 1}, {unique: true});

schema.post('save', async function () {
    await this.constructor.calculateAvgRating(this.product);
});

schema.pre(/^find/, async function (next) {
    this.populate("createdBy", "-createdAt -listInSelling -listSold -listPurchased -refreshToken -token -socialsOAuth -updatedAt");
    next();
})

const Review = mongoose.model('Review', schema);

module.exports = Review;
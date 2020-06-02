const mongoose = require('mongoose');
const User = require("./user");
const Product = require("./product");
const Cart = require("./cart");

const schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must have a UserId']
    },
    products: [{
      color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Order must have ProductId']
      },
      quantity: {
        type: Number,
        required: [true, "Need quantity for the bill"]
      }
    }],
    shipping: {
      fullname: {
        type: String,
        required: [true, "Shipping need a fullname for the bill"],
      },
      addressLine1: {
        type: String,
        required: [true, "Need address for the bill"],
      },
      addressLine2: {
        type: String,
      },
      telephone: {
        type: Number,
        required: [true, "Need telephone number for the bill"],
      },
      city: {
        type: String,
        required: [true, "Need city for the bill"],
      },
      region: {
        type: String,
      },
      zipCode: {
        type: Number,
        required: [true, "Need telephone number for the bill"],
      },
      country: {
        type: String,
        required: [true, "Need country for the bill"],
      }
    },
    subTotal: {
      type: Number,
      required: [true, "Need subTotal for the bill"]
    },
    discount: {
      type: Number,
      required: [true, "Need discount for the bill"]
    },
    total: {
      type: Number,
      required: [true, "Need total for the bill"]
    },
    paymentID: {
        type: String,
        default: null,
        required: [true, 'Order must have a PaymentID']
    },
    paid: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

schema.post('save', async function () {
    const thisUser = await User.findOne({ _id: this.user });
    thisUser.listPurchased.push(this._id);
    await thisUser.save({validateBeforeSave: false});
  });

  schema.post('save', async function () {
      for (let i = 0; i < this.products.length; i++) {
        const id = this.products[i].color;
        const thisProduct = await mongoose.model('Product').findById(id);
        const thisUserSold = await User.findOne({ _id: thisProduct.createdBy});
        const idx = thisUserSold.listSold.findIndex(el => el.toString() == this._id.toString());
        if (idx === -1) {
          thisUserSold.listSold.push(this._id);
          await thisUserSold.save({validateBeforeSave: false});
        }
        break;
      }
  });

schema.statics.countOrder = async function (productId) {
    const count = await Order.aggregate([
        {$match: {product: productId}},
        {$group: {_id: "$product", count: {$sum: "$quantity"}}}
    ]);
    return count[0] ? count[0].count : 0;
}

const Order = mongoose.model('Order', schema);

module.exports = Order;
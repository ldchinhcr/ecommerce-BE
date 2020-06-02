const mongoose = require("mongoose");

const schema = mongoose.Schema({
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListProducts",
        required: [true, "A product need a name"],
      },
      color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "A product need a name"],
      },
      quantity: {
        type: Number,
        required: [true, "A product need a quantity"],
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cart must have a UserId']
  },
});

schema.index({_id: 1, createdBy: 1}, {unique: true});

const Cart = mongoose.model('Cart', schema);

module.exports = Cart;

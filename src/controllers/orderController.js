const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Order = require("../models/order");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const Product = require("../models/product");
const Cart = require("../models/cart");
const sendEmail = require("../utils/email");
const verifyHTMLForm = require("../assets/verify");

exports.createOrder = catchAsync(async function (req, res, next) {
  const { cardInfo, infoShipping } = req.body;

  if (!cardInfo || !infoShipping) {
    return next(new AppError("Order must contain all required fields", 400));
  }

  const cartWithId = await Cart.findOne({ createdBy: req.user._id });

  const cart = await Cart.findOne({ createdBy: req.user._id })
    .populate("products.color")
    .populate("products.product");

  if (!cart) {
    return next(
      new AppError("This user does not have any products in the cart", 400)
    );
  }

  const listProducts = cart.products.map((product) => product);

  const listColor = cartWithId.products.map(({color, quantity}) => ({color, quantity}))

  const { subTotal, discount, total } = countTotalPrice(listProducts);

  let listOverAvailability = [];

  for (let i = 0; i < listProducts.length; i++) {
    const productCurrent = await Product.findOne({_id: listProducts[i].color._id});
    if (productCurrent.availability < listProducts[i].quantity) {
      listOverAvailability.push(productCurrent.color);
    }
  }

  if (listOverAvailability.length === 0) {
    for (let i = 0; i < listProducts.length; i++) {
      const productCurrent = await Product.findById(listProducts[i].color._id);
      productCurrent.availability = productCurrent.availability - listProducts[i].quantity;
      await productCurrent.save({validateBeforeSave: false});
    }
  } else {
    return next(new AppError(`Over Availability with: ${listOverAvailability.join(", ")}`, 400))
  }

  const cardToken = await stripe.tokens.create({
    card: {
      number: cardInfo.number.split(" ").join(""),
      name: cardInfo.name,
      exp_month: cardInfo.month,
      exp_year: cardInfo.year,
      cvc: cardInfo.cvc,
    },
  });

  const payment = await stripe.charges.create({
    amount: (total * 100).toFixed(2)*1,
    currency: "usd",
    source: cardToken.id,
    description: `Payment of user ${req.user.name} for: ${listProducts
      .map((el) => el.product.name)
      .join(", ")}`,
  });

  if (!payment.paid) {
    return next(
      new AppError("Sorry something went wrong during charge!!", 400)
    );
  }

  const order = await Order.create({
    user: req.user._id,
    products: listColor,
    shipping: infoShipping,
    subTotal: subTotal,
    discount: discount,
    total: (total).toFixed(2)*1,
    paymentID: payment.id,
    paid: true,
  });

  const link = `${process.env.CLIENT_DOMAIN}/explore`;
  const namebutton = "Explore";
  const msg = `Your order has been created successfully with id: #${order._id} .\n Thank you!`;
  const html = verifyHTMLForm(msg, namebutton, link);

  await sendEmail({
      email: req.user.email,
      subject: `Order: ${order._id} - Travel Suitcase - Bag Fashion`,
      html,
    });

  res.status(201).json({ status: true, data: order });
});

const countTotalPrice = (products) => {
  const subTotal = products.reduce((total, product) => {
    return total + product.product.price * +product.quantity;
  }, 0);

  const discount = products.reduce((total, product) => {
    return (
      total +
      product.product.price *
        (product.product.priceDiscount / 100) *
        +product.quantity
    );
  }, 0);

  const total = subTotal - discount;

  return { subTotal, discount, total };
};

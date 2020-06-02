const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: false,
    message: 'Too many requests from this IP, please try again in an hour'
  }
})
const limiterAuth = rateLimit({
  max: 60,
  windowMs: 60 * 60 * 1000,
  message: {
    status: false,
    message: 'Too many requests from this IP, please try again in an hour'
  }
})


app.use('/shop', limiter);
app.use('/auth', limiterAuth);

app.use(xss());

app.use(hpp({
  whitelist: [
    'ratingsQuantity',
    'ratingsAverage',
    'priceDiscount',
    'name',
    'price',
    'color'
  ]
}));


app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '10kb'}));

module.exports = app;

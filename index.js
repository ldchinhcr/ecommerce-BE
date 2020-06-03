require('dotenv').config({path: '.env'})
const app = require('./app');
const AppError = require('./src/utils/appError');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('./src/auth/passport');
const globalErrorHandler = require('./src/controllers/errorController');
const authRoute = require('./src/routes/authRoute');
const userRoute = require('./src/routes/usersRoute');
const categoriesRoute = require('./src/routes/categoriesRoute');
const productsRoute = require('./src/routes/productsRoute');
const reviewsRoute = require('./src/routes/reviewsRoute');
const paymentRoute = require('./src/routes/paymentRoute');
const statsRoute = require('./src/routes/statsRoute');
const cartRoute = require('./src/routes/cartRoute');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require("cors");

app.use(cors());
app.use(mongoSanitize());
app.use(passport.initialize());

const DB_URL = process.env.MONGODB_URI.replace("<password>", process.env.MONGODB_PASS);

mongoose.connect(DB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
.then(() => console.log("Successfully connected to database!"))

app.use('/auth', authRoute);
app.use('/users', userRoute);
app.use('/category', categoriesRoute);
app.use('/category/:cslug/products', productsRoute);
app.use('/category/:cslug/products/:pslug/reviews', reviewsRoute);
app.use('/category/:cslug/products/:pslug/:dpslug/buy', paymentRoute);
app.use('/stats', statsRoute);
app.use('/cart', cartRoute);

app.get("/", async(req, res) => {
    return res.status(200).json({ status: true, message: 'Connection established' });
  });

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
})

app.use(globalErrorHandler);

let server;

if (process.env.NODE_ENV === 'production') {
  server = http.createServer(app);
} else {
  server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, "./server.key")),
    cert: fs.readFileSync(path.join(__dirname, "./server.cert"))
  },app);
}

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 🎆 Shutting down ...')
    console.log(err.name, err.message);
    process.exit(1);
  });

server.listen(process.env.PORT, () => {
    console.log("App running on port ", process.env.PORT);
  });

process.on('unhandledRejection', err => {
  console.log('UNHANDLER REJECTION! 🎆 Shutting down ...')
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
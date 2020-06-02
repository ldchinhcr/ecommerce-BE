const User = require("../models/user");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.login = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;
  if (!password || !email) {
    return next(new AppError("Email and either password are required", 400));
  }
  const user = await User.loginWithCredentials(email, password);
  const token = await User.generateToken(user);
  const refreshToken = await User.generateRefreshToken(user);
  user.token.push(token);
  user.refreshToken.push(refreshToken);
  await User.findByIdAndUpdate(user._id, {
    token: user.token,
    refreshToken: user.refreshToken,
    socialsOAuth: false
  });

  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   secure: true,
  //   httpOnly: true
  // };
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: true,
    user: user,
    token: token,
    refreshToken: refreshToken,
  });
});

exports.logout = catchAsync(async function (req, res) {
  const { email } = req.user;
  const token = req.headers.authorization.replace("Bearer ", "");
  const refreshToken = req.body.refreshToken;
  const user = await User.findOne({ email });
  user.token = user.token.filter((id) => id !== token);
  user.refreshToken = user.refreshToken.filter((id) => id !== refreshToken);
  await User.findByIdAndUpdate(user._id, {
    token: user.token,
    refreshToken: user.refreshToken,
  });
  res.status(204).json({ status: true, message: "Logout successful" });
});

exports.logoutall = catchAsync(async function (req, res) {
  const { email } = req.user;
  const user = await User.findOne({ email });
  await User.findByIdAndUpdate(user._id, { token: [], refreshToken: [] });
  res.status(204).json({ status: true, message: "Logout successful" });
});

exports.auth = catchAsync(async function (req, res, next) {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  )
    return next(new AppError("You're not logged in, please login first!", 403));
  const token = req.headers.authorization.replace("Bearer ", "");
  if (token) {
    const tokenJson = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    const user = await User.findById(tokenJson.id);
    if (user) {
      req.user = user;
      next();
    } else {
      return next(new AppError("User not found!", 404));
    }
  } else {
    return next(new AppError("You're not logged in, please login first", 401));
  }
});

exports.refreshNewAccessToken = catchAsync(async function (req, res, next) {
  let oldAccessToken;
  if (
    req.headers.authorization ||
    req.headers.authorization.startsWith("Bearer ")
  ) {
    oldAccessToken = req.headers.authorization.replace("Bearer ", "");
  }
  if (!req.body.refreshToken)
    return next(new AppError("Please provide refresh token", 403));
  const refreshToken = req.body.refreshToken;
  const refreshTokenJson = jwt.verify(
    refreshToken,
    process.env.SECRET_KEY_REFRESH_TOKEN
  );
  const user = await User.findById(refreshTokenJson.id);
  if (oldAccessToken) {
    user.token = user.token.filter((id) => id !== oldAccessToken);
  }
  const newAccessToken = await User.generateToken(user);
  user.token.push(newAccessToken);
  await User.findByIdAndUpdate(user._id, { token: user.token });
  res.status(200).json({ status: true, token: newAccessToken });
});
const crypto = require('crypto');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const verifyHTMLForm = require('../assets/verify');

exports.forgotPassword = catchAsync(async function (req, res, next) {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with this email address.', 404));
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
  
    const resetURL = `${process.env.CLIENT_DOMAIN}/resetpassword/?resettoken=${resetToken}`;
    const msg = `Forgot your password? Submit with your new password and passwordConfirm to the link below. If you didn't forget your password, please ignore this email!`;
    const namebutton = 'Reset Password';
    const html = verifyHTMLForm(msg, namebutton, resetURL);
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset Token (valid for 10 mins)',
        html,
      });
  
      res.status(200).json({
        status: true,
        message: 'Token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(err.message)
      return next(
        new AppError(
          'There was an error when trying to send the email. Try again later!',
          500
        )
      );
    }
  });
  
  exports.resetPassword = catchAsync(async function (req, res, next) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');
  
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
  
    
    user.token = [];
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();
    
  
    const link = `${process.env.CLIENT_DOMAIN}/login`;;
    const msg = `Here your new password: ${req.body.password}.\n Please login again to change your password`;
    const namebutton = 'Login';
    const html = verifyHTMLForm(msg, namebutton, link);
    
    res.status(200).json({
      status: true,
      message: 'Password had been set successfully. An email with your new password has been sent to your email address.'
    })
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your new password',
        html,
      });
  
    } catch (err) {
      return next(
        new AppError(
          'There was an error when trying to send the email!',
          500
        )
      );
    }
  });

  exports.createVerifyToken = catchAsync(async function (req, res, next) {
    const user = req.user;
    const verifyToken = await user.createVerifyToken();
    const verifyURL = `${process.env.CLIENT_DOMAIN}/verifyaccount/?verifytoken=${verifyToken}`;

    const link = `${process.env.CLIENT_DOMAIN}/login`;;
    const namebutton = 'Login';
    const msg = `To successfully verify your account please click this link: ${verifyURL}  .\n Thank you!`;
    const html = verifyHTMLForm(msg, namebutton, link);
    try {
      await sendEmail({
        email: user.email,
        subject: 'Please verify your account (valid for 60 mins)',
        html,
      });

      res.status(200).json({
        status: true,
        message: 'Verify token sent to email',
        data: user
      });
    } catch (err) {
      user.verifyToken = undefined;
      user.verifyExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(err.message)
      return next(
        new AppError(
          'There was an error when trying to send the email. Try again later!',
          500
        )
      );
    }
  });

  exports.verifyAccount = catchAsync(async function (req, res, next) {
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');
    
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Verified token is invalid or has expired', 400));
    }

    user.verified = true;
    user.verifyExpires = undefined;
    user.verifyToken = undefined;
    await user.save({ validateBeforeSave: false});

    const link = `${process.env.CLIENT_DOMAIN}/login`;;
    const msg = `Your account has been verified.\n Please login to start explore our service!`;
    const namebutton = 'Login';
    const html = verifyHTMLForm(msg, namebutton, link);
    
    res.status(200).json({
      status: true,
      message: 'Account has been verified!.'
    })
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Account has been verified',
        html,
      });
  
    } catch (err) {
      return next(
        new AppError(
          'There was an error when trying to send the email!',
          500
        )
      );
    }
  })
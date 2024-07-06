const { promisify } = require('util'); // this is Bulit in function in NodeJS. I used IT to make the jwt.verigy ASYNC
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

//

const signToken = (id) => {
  //JWT TOKEN METHOD
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// in this method we are sending JWT to client + all RESPONSES
const createSendToken = (user, statusCode, res) => {
  // we got the Res as parameter because w want to have access to send res to client
  const token = signToken(user._id);

  // JWT cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true, // by using this option cookie will be sent via HTTPS
    httpOnly: true, // makes sure that cookie wont be accesed or modified any way using browser
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // removing password field

  res.status(statusCode).json({
    status: 'success',
    token, // we send token as a RES
    data: {
      user,
    },
  });
};

// Signing out User
exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // by this way we insure that the user enters what we only need no extra input needed
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email & password exist
  if (!email || !password) {
    return next(new AppError('Please check email or password', 400));
  }
  // 2)check if  user exist && password is correct
  const user = await User.findOne({ email }).select('+password'); // user here contains model

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  // 3) if everything is ok, send res
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // this code for authentication protection

  // 1) get Token From user and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in.', 401));
  }

  //

  // 2) verification of the Token "not a manipulated token OR an EXPIRED token "
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //

  // 3) check if user still existed
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belongs to the token not exist.', 401));
  }

  //

  // 4) check if user changed password after the token was issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again', 401),
    );
  }
  req.user = currentUser; // this line of code contain the user inside req.user
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // THIS function restrect the access to delete a tour to [admin , lead-guied]

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have a permission to preform this action!', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //

  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateModifiedOnly: true });

  // 3)send it to user's email

  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user Based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, check if user existed then CHANGE password
  if (!user) {
    return next(new AppError('Token is invalid or Expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // this to save changes in DB

  // 3) Update changedPasswordAt property for user and we did it using Pre-save middleware0

  // 4) log the user in + send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Only for rendered pages, no errors! 'PUG #190'
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser; // res.locals.user Now we have access for user in pug using it
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

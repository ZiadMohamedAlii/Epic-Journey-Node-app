const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // returns isOperational=true
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  console.log(value);
  const message = `Duplicate field '${value}'. Please use another name`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please login again', 401);

const handleJWTExpiredError = () =>
  new AppError('token has been expired. please login again', 401);

const sendErrorDev = (err, req, res) => {
  //
  // EDIT ocurred in lec #193 when we wanted to add error handling for the Front-end
  //

  if (req.originalUrl.startsWith('/api')) {
    // this handler for the Node Api
    res.status(err.statusCode).json({
      error: err,
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // This handler for handling front end errors
    res.status(err.statusCode).render('error', {
      title: 'Something went Wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, res) => {
  //
  // EDIT ocurred in lec #193 when we wanted to add error handling for the Front-end
  //

  // API
  if (req.originalUrl.startsWith('/api')) {
    // this handelS production NODE API Errors
    // Operational, trusted err: send message to Client  don't expose sensitive information.
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or other UnkNOWN err: don't leak err details
    console.error('Error', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE Error handling
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = JSON.parse(JSON.stringify(err)); // this for making a new object from err with the same properties
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError(); // this one handels if the token in being manpulated

    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(); //this one hanldels if the token is expired

    sendErrorProd(error, req, res);
  }
  next();
};

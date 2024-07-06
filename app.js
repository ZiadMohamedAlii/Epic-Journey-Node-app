// 1) MODULES
const path = require('path'); // BEST practice when it comes to specify __dirname
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); // this NPM  package for limiting requests from an IP "BRUTAL FORCE ATTACK"
const helmet = require('helmet'); // This NPM package for security of the http
const mongoSanitize = require('express-mongo-sanitize'); // This NPM package to prevent noSQL queries
const xss = require('xss-clean'); // This package to prevent XSS attacks
const hpp = require('hpp');
const cookieParser = require('cookie-parser'); // Used to Parse data form the Cookie

// the variable express returns a functions
const app = express(); // w assigned the express variable which is =  functions to an app to use this functions
const AppError = require('./utils/appError'); // AppError Class
const globalErrorHandler = require('./controllers/errorController'); // this where the global Error handelr is handeld and w called it here

// Router handlers are called here
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');

//

// Setting up PUG
app.set('view engine', 'pug'); // Defining View engine 'Pug'
app.set('views', path.join(__dirname, 'views')); // Points to views folder

// 2)                  GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/`)); // OLd defining of Path
app.use(express.static(path.join(__dirname, 'public')));

// Security for http
// app.use(helmet()); // node js helmet only
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://cdnjs.cloudflare.com',
        'https://api.mapbox.com',
        'blob:',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      workerSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.tiles.mapbox.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://m.stripe.network',
      ],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      formAction: ["'self'"],
      connectSrc: [
        "'self'",
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://bundle.js:*',
        'ws://127.0.0.1:*/',
      ],
      upgradeInsecureRequests: [],
    },
  }),
);

// Development logging in
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // 3rd party middleware this gives use the log off process
}

// Limit request for Same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'Too many requests from this IP, please try again later in an 1 HOUR',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); //middleware // Body parser, reading data from body to req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse Data form COOKIE

// Data sanitization against NOsql query attacks
app.use(mongoSanitize());

// Data sanitization form xss attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//

// TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

//

// 4) MOUNTED ROUTES

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

//

// This MIDDLEWARE handles the Unhandled Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// error Handling MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;

//////////////////////
//this app.js is used to config the application
//all data related to express should be done here
////////////////////

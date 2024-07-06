const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // handler factory functions
const AppError = require('../utils/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get The current booked Tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create a Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],

    // This success url contain the TOUR,USER,PRICE which will be saved in DB using the createBookingCheckout function below
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    cancel_url: `${req.protocol}://${req.get('host')}/`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3.create a session as res
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  // to CREATE a new document in the database whenever a user successfully purchases a tour
  // Gets its data from the Success Url
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

// exports.getAllTours = factory.getAll(Tour);

// Get all Bookings
exports.getAllBookings = factory.getAll(Booking);

// Create Booking  'admin - lead-guid'
exports.createBooking = factory.createOne(Booking);

// Get 1 Booking /:id  'admin - lead-guid'
exports.getBooking = factory.getOne(Booking);

// update Booking 'admin - lead-guid'
exports.updateBooking = factory.updateOne(Booking);

// delete Booking  'admin - lead-guid'
exports.deleteBooking = factory.deleteOne(Booking);

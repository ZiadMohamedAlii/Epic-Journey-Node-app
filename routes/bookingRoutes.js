const express = require('express');
const authController = require('./../controllers/authController');
const bookingController = require('../controllers/bookingController');
//router
const router = express.Router();

router.use(authController.protect); // after this Middleware all routes has protection

router.post('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide')); // after this Middleware the admin and lead-guide has the responsibilities

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;

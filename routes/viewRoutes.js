// THIS ROUTER FILE FOR THE PUG ROUTES
const viewsController = require('../controllers/viewsController');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
); // router for the Home page
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour); // route for getting Tur
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);
module.exports = router;

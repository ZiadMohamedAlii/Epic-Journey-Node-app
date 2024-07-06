// const { getAllTours, createTour } = require('./../controllers/tourController');
const express = require('express');
const tourController = require('./../controllers/tourController'); //this will return an object we can use it
const authController = require('./../controllers/authController'); // checks for authntication & authrization in TOURS
const reviewRouter = require('../routes/reviewRoutes'); // Used in nested router
const router = express.Router();
//Param middle

//Aliasing route
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

//Aggregation Pipeline route's
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan,
  );

// ROUTES
router
  .route('/')
  .get(tourController.getAllTours) // we Removed the protection from getalltours
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

// POST tour/:tourId/review
// GET tour/:tourId/reviews/reviewId

// nested route for tour reviews using 'mergeParams'
router.use('/:tourId/reviews', reviewRouter); // Redirect to reviewRouter

// Geospatial Route
// '/tours-within/233/center/36.55444,48.215558/unit/40'
router
  .route('/tours-within/:distance/center/:latlng/unit/:mi')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

module.exports = router;

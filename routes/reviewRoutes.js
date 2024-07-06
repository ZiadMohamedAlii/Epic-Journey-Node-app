const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// router settings
const router = express.Router({ mergeParams: true }); //used to create a router - we used mergeParams to get tourId form the tour router

// this route handels 2 routes
// GET reviews/
// POST tour/:tourId/reviews
// GET tour/:tourId/reviews

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;

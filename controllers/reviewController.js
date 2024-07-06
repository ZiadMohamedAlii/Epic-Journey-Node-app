const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // handler factory functions

// GET All Reviews
exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {}; // used for GET the tour and its reviews
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'Success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

//

// GET Review:ID
exports.getReview = factory.getOne(Review);
// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     return next(new AppError('No Review with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'Success',
//     data: {
//       review,
//     },
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  // this middleware to set the IDs for user and tour in the create function
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user;
  next();
};

//

// POST
exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'Success',
//     data: {
//       review: newReview,
//     },
//   });
// });

//

// DELETE
exports.deleteReview = factory.deleteOne(Review); //Delete using factory handller

//

// PATCH
exports.updateReview = factory.updateOne(Review); //Update using factory hanlder

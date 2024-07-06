const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },

    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    tour: {
      // Parent referencing to TourSchema
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a Tour'],
    },

    user: {
      // Parent referencing to UserSchema
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//this Index makes user Review multiple tours and for each Tour one Review.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// query middleware
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour', // tour contains tourSchema "data"
  //   select: 'name ',
  // });
  this.populate({
    path: 'user', // tour contains tourSchema "data"
    select: 'name photo', // we only need the name and photo of user
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this static function used to calculate the ratingsQuantity & ratingsAverage + push them into there Tour
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this Middleware used to call the calcAverageRatings static function into the Tour
  // this points to current sechma
  const tourId = this.tour;
  this.constructor.calcAverageRatings(tourId);
});

reviewSchema.post(/^findOneAnd/, async function (docs) {
  // this Middleware used when delete or update Reviews on a tour
  await docs.constructor.calcAverageRatings(docs.tour);
});

const Review = mongoose.model('Reviews', reviewSchema);

module.exports = Review;

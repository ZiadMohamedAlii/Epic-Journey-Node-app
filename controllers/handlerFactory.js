const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// GET All "Tour-User-Reviews"
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {}; // used for GET the tour and its reviews 'Get all reviews on a tour'
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain(); // .explain used to get see 'nReturned & totalDocsExamined '
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

// GET for "oneTour-oneUser-oneReview" using :ID

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      // this for handling the error 404 using the globalErrorHandler and AppError class ... this based on the ID
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// DELETE for 'Tours-Users-reviews'
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      // this for handling the erros 404 using the globalErrorHandler and AppError class ... this based on the ID
      return next(new AppError(`No document Found With That ID `, 404));
    }
    res.status(204).json({
      status: 'success',
      data: doc,
    });
  });

// UPDATE for 'Tours-Users-Reviews'
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      // this for handling the error 404 using the globalErrorHandler and AppError class ... this based on the ID
      return next(new AppError(`No Document Found With That ID `, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// CREATE for 'Tours-Reviews'
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

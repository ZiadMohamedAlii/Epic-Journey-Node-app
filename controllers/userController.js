const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory'); // handler factory functions
const multer = require('multer'); // NPM package for uploading IMAGES
const sharp = require('sharp');
//

//                        methodS

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//

//                    EVENT handler

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  // using Sharp
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  console.log(req.file);
  next();
};

exports.getMe = (req, res, next) => {
  // this middleWare used to switch the "req.params.id " in the getOne Handler to " req.user.id" so we can get the user.
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user entered password or confirmPassword in BODY
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) filter out the not allowed filed to be modified
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename; // 'MULTER' This for changing name in DB for the uploaded image

  // 3) update user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // returns new DOC to the DB
    runValidators: true,
  });

  // 4) Send res + new user data
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) we want to set the current user to be inActive
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // 2) send res
  res.status(204).json({
    status: 'Success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this Route is not yet defined! Please use /signup instead ',
  });
};

// Get All Users
exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

// GET user:Id
exports.getUser = factory.getOne(User);
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this Route is not yet defined',
//   });
// };

// PATCH
exports.updateUser = factory.updateOne(User); // DO NOT update password witH this
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this Route is not yet defined',
//   });
// };

// DELETE
exports.deleteUser = factory.deleteOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'this Route is not yet defined',
//   });
// };

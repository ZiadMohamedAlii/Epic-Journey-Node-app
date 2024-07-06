const express = require('express');
const fs = require('fs');
const userController = require('../controllers/userController');
const authController = require('./../controllers/authController');

//router
const router = express.Router();

// no need for Auth - restriction.
router.route('/signup').post(authController.signUp); // doesn't follow REST ARCH
router.route('/login').post(authController.login); // doesn't follow REST ARCH
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); // any route handler comes after this Middleware will automatically contain PROTECT handler

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto, // Using Multer to Upload Photos
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); // any route handler comes after this Middleware will automatically contain restrict() & PROTECT handlers

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

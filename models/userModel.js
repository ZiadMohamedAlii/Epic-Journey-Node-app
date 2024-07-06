const mongoose = require('mongoose');
const validator = require('validator'); // from NPM
const bcrypt = require('bcryptjs'); // from NPM
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validator: [validator.isEmail, 'Please provide valid Email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // enum constraint restricts the allowed values for the role field
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please Provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [64, 'Password must be at most 64 characters'],
    select: false, // This makes the password wont appere in postman 'res' and for hackers
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm your password'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [64, 'Password must be at most 64 characters'],
    validate: {
      //this only works ON CREATE & SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password must match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String, // this field will hold the restToken it behaves as a password
  passwordResetExpires: Date, // time taken by reset token to Expire
  active: { type: Boolean, default: true, select: false }, // this for "delete user" set user inactive.
});

//                            MIDDLEWARES

// pre-save Document MIDDLEWARE to encrypt "HASH" PASSWORD in DB
userSchema.pre('save', async function (next) {
  //   used if the password not changed or updated
  if (!this.isModified('password')) return next();

  // hashing password using bcrypt
  this.password = await bcrypt.hash(this.password, 12); // HashingPASS

  // deleting the passwordConfirm from DB
  this.passwordConfirm = undefined;
  next();
});

// THis middleware checks when user changed password 'RESETpassword' logic
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this keyword points to current query obj
  this.find({ active: { $ne: false } });
  next();
});

//

//                            METHODS
userSchema.methods.correctPassword = async function (
  candidatePassword, // password enterd by the user
  userPassword, // password saved in DB
) {
  // This methode used to compare passwords

  // we didnt use this.password becouse in the schmea w defind the password as select:false so it wont appere by using this.
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesStamp) {
  // THIS condition for  the user if he changed password
  if (this.passwordChanged) {
    const changedTimestamp = parseInt(
      this.passwordChanged.getTime() / 1000,
      10,
    );
    // console.log(this.passwordChanged, JWTTimesStamp);
    return JWTTimesStamp < changedTimestamp;
  }
  // it means that user didnt change password after JWTTimestamp so return "FALSE"
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // this is the plain text token which will be sent to user

  this.passwordResetToken = crypto // this is the encrypted token which will be saved in DB
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // this the token will be sent to user
};

const User = mongoose.model('User', userSchema);

module.exports = User;

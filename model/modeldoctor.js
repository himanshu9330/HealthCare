const mongoose = require('mongoose');
const { error } = require('node:console');
const { createHmac, randomBytes } = require('node:crypto');
const {createTokenforUser}=require('../service/auth')
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true
  },
  salt: {
    type: String
  },
  specialization: {
    type: String,
    required: true
  },
  symptoms: {
    type: [String], 
    required: true
  },
  available: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

/// Password hashing before saving
doctorSchema.pre('save', function (next) {
  const user = this;
  

  /// Fix typo: should be isModified not ismodified
  if (!user.isModified("password")) return next();

  const salt = randomBytes(16).toString('hex');
  const hashedPassword = createHmac('sha256', salt)
    .update(user.password)
    .digest('hex');

  user.salt = salt;
  user.password = hashedPassword;

  next();
});
  ///matching password from hashed password and user password
doctorSchema.statics.matchpassword = async function (email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("This email is not registered");
  }

  const salt = user.salt;
  const hashPassword = user.password;

  const userProvidedPassword = createHmac('sha256', salt)
    .update(password)
    .digest('hex');

  if (hashPassword !== userProvidedPassword) {
    console.log("Password mismatch");
    throw new Error("Incorrect password");
  }

  console.log("Password matched");

  const token = createTokenforUser(user); // ✅ JWT generated
  return { token, user }; // ✅ Fix: return both token and user
};

const doctor = mongoose.model("doctor", doctorSchema);

module.exports = {
  doctor
};

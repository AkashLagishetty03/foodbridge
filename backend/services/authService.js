const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const registerUser = async ({ name, email, password, role, phone, organization }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered.', 400);
  }

  // Only allow DONOR and NGO via self-registration
  const allowedRoles = ['DONOR', 'NGO'];
  const assignedRole = allowedRoles.includes(role?.toUpperCase())
    ? role.toUpperCase()
    : 'DONOR';

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    phone,
    organization,
  });

  const token = generateToken(user._id);
  return { user, token };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact admin.', 403);
  }

  const token = generateToken(user._id);
  return { user, token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

module.exports = { registerUser, loginUser, getProfile };

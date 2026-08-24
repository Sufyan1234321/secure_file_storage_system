import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { generateAuthToken } from '../utils/generateToken.js';

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });

  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword });

  return createAuthResponse(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return createAuthResponse(user);
}

function createAuthResponse(user) {
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return {
    user: userData,
    token: generateAuthToken(user)
  };
}

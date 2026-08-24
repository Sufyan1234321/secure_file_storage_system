import { validationResult } from 'express-validator';
import { loginUser, registerUser } from '../services/auth.service.js';
import { sendError, sendSuccess } from '../utils/response.js';

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    throw error;
  }
}

export async function register(req, res) {
  try {
    validate(req);
    const result = await registerUser(req.body);
    return sendSuccess(res, result, 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function login(req, res) {
  try {
    validate(req);
    const result = await loginUser(req.body);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export function currentUser(req, res) {
  const user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  };

  return sendSuccess(res, { user });
}

import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/response';
import { sendError } from '../../utils/response';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.register(req.body);
    return sendSuccess(res, data, 'Registration successful', 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, data, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body);
    // Always 200 — never reveal whether the email exists
    return sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid or expired reset token') {
      return sendError(res, err.message, 401);
    }
    return next(err);
  }
}

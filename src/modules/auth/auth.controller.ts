import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/response';

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

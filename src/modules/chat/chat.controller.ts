import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as chatService from './chat.service';
import { sendSuccess } from '../../utils/response';

export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { message, conversation_id } = req.body;
    const result = await chatService.sendMessage(req.user.id, message, conversation_id);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { SendMessageDto } from './chat.dto';
import * as chatController from './chat.controller';

const router = Router();

/**
 * @openapi
 * /chat/message:
 *   post:
 *     tags: [Chat]
 *     summary: Send a chat message to MamaGuide
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, maxLength: 2000 }
 *               conversation_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Assistant reply and conversation details
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/message',
  authMiddleware as any,
  validate(SendMessageDto),
  chatController.sendMessage as any,
);

export default router;

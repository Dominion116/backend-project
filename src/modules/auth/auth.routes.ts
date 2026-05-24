import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { RegisterDto, LoginDto } from './auth.dto';
import * as authController from './auth.controller';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates the Supabase auth user and the matching `user_profiles` row in one call.
 *       `language` and `pregnancy_stage` are not set here — they are collected during the
 *       onboarding flow and saved via `PATCH /api/profile`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adaeze@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MyPassword1!
 *               full_name:
 *                 type: string
 *                 maxLength: 120
 *                 example: Adaeze Okonkwo
 *               role:
 *                 type: string
 *                 enum: [pregnant_woman, nurse, researcher]
 *                 default: pregnant_woman
 *                 description: |
 *                   Selected from the role picker on the registration screen.
 *                   `admin` is not self-assignable — it is granted by an existing admin
 *                   via `PATCH /api/admin/users/:id/role`.
 *               phone_number:
 *                 type: string
 *                 maxLength: 20
 *                 example: "+2348001234567"
 *                 description: Optional. Nigerian format recommended. Used for emergency alerts.
 *     responses:
 *       201:
 *         description: User and profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object, description: Supabase auth user object }
 *                     session: { type: object, description: JWT session — null if email confirmation is required }
 *       422:
 *         description: Validation error (e.g. invalid role, password too short)
 *       400:
 *         description: Supabase auth error (e.g. email already registered)
 */
router.post('/register', validate(RegisterDto), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: JWT token returned
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(LoginDto), authController.login);

export default router;

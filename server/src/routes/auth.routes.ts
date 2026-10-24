import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateVaultVerifierSchema,
  updateAccountSettingsSchema
} from '../validators/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/vault-verifier', authenticate, validate(updateVaultVerifierSchema), authController.updateVaultVerifier);
router.patch('/settings', authenticate, validate(updateAccountSettingsSchema), authController.updateSettings);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import credentialRoutes from './credential.routes.js';
import { isDbConnected } from '../config/database.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected' : 'disconnected'
  });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/credentials', credentialRoutes);

export default router;

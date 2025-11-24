// src/routes/emailRoutes.ts
import { Router } from 'express';
import { sendBulkEmailHandler, sendNotificationEmailHandler } from '../controllers/redis.controller';

const router = Router();

router.post('/send-bulk-email', sendBulkEmailHandler);
router.post('/send-notification-email', sendNotificationEmailHandler);

export default router;

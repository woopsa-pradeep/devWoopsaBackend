// src/controllers/emailController.ts
import { Request, Response } from 'express';
import { BulkEmailJobData } from '../interfaces/redis.interface';
import { emailQueue, emailNotificationQueue } from '../configuration/config';

export const sendBulkEmailHandler = async (req: Request, res: Response) => {
  try {
    const { users, subject, html } = req.body;

    // BASIC VALIDATION
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'users array is required' });
    }
    if (!subject || !html) {
      return res.status(400).json({ message: 'subject and html are required' });
    }

    // DON’T send here. Just enqueue.
    const jobs: BulkEmailJobData[] = users.map((u: any) => ({
      to: u.email,      // adapt to your structure
      subject,
      html,
    }));

    // Add jobs to queue
    await Promise.all(
      jobs.map((job) =>
        emailQueue.add('send-email', job, {
          attempts: 3,              // retry up to 3 times
          backoff: { type: 'exponential', delay: 10000 }, // 10s, 20s, 40s
          removeOnComplete: true,
          removeOnFail: false,
        })
      )
    );

    // RESPONSE IS FAST – server not blocked.
    return res.status(202).json({
      message: 'Emails queued successfully',
      queuedCount: jobs.length,
    });
  } catch (err) {
    console.error('Error queuing emails:', err);
    return res.status(500).json({ message: 'Failed to queue emails' });
  }
};

export const sendNotificationEmailHandler = async (req: Request, res: Response) => {
  try {
    const { users, subject, html } = req.body;

    // BASIC VALIDATION
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'users array is required' });
    }
    if (!subject || !html) {
      return res.status(400).json({ message: 'subject and html are required' });
    }

    // DON'T send here. Just enqueue.
    const jobs: BulkEmailJobData[] = users.map((u: any) => ({
      to: u.email,      // adapt to your structure
      subject,
      html,
    }));

    // Add jobs to notification queue
    await Promise.all(
      jobs.map((job) =>
        emailNotificationQueue.add('send-notification-email', job, {
          attempts: 3,              // retry up to 3 times
          backoff: { type: 'exponential', delay: 10000 }, // 10s, 20s, 40s
          removeOnComplete: true,
          removeOnFail: false,
        })
      )
    );

    // RESPONSE IS FAST – server not blocked.
    return res.status(202).json({
      message: 'Notification emails queued successfully',
      queuedCount: jobs.length,
    });
  } catch (err) {
    console.error('Error queuing notification emails:', err);
    return res.status(500).json({ message: 'Failed to queue notification emails' });
  }
};

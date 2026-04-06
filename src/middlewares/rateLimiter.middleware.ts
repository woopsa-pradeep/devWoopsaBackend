import rateLimit from 'express-rate-limit';

/** Server-wide limit: 80 requests per minute per IP. Apply early in index.ts. */
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

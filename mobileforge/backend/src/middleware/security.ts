import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Helmet with config tuned for an API server that also serves HTML previews.
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Origin validation for state-changing requests (CSRF protection).
// Only enforced when FRONTEND_URL is explicitly set (i.e. production).
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const allowedOrigin = process.env.FRONTEND_URL;
  if (!allowedOrigin) return next();

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next();

  const allowed = new URL(allowedOrigin).origin;
  try {
    const incoming = new URL(origin as string).origin;
    if (incoming !== allowed) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
  } catch {
    return res.status(403).json({ error: 'Invalid origin' });
  }
  return next();
}

// Request logging for audit trail.
export function auditLog(req: Request, _res: Response, next: NextFunction) {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    console.log(`[audit] ${req.method} ${req.path} from ${ip} at ${new Date().toISOString()}`);
  }
  return next();
}

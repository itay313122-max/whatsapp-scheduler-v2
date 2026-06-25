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

/**
 * Whether a request Origin is allowed. Accepts:
 *  - any origin in FRONTEND_URL (comma-separated list supported)
 *  - localhost / 127.0.0.1 on any port (local dev)
 *  - any *.vercel.app subdomain (so renaming the Vercel project never breaks
 *    the API again)
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true; // non-browser clients / same-origin requests

  const configured = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const url = new URL(origin);
    if (configured.some((c) => url.origin === new URL(c).origin)) return true;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    if (url.hostname.endsWith('.vercel.app')) return true;
    return false;
  } catch {
    return false;
  }
}

// Origin validation for state-changing requests (CSRF protection).
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next();

  if (!isAllowedOrigin(origin as string)) {
    return res.status(403).json({ error: 'Origin not allowed' });
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

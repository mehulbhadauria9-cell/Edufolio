import { verifyToken } from '../utils/auth.js';
import { store } from '../models/store.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const user = await store.findUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User associated with session not found' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  next();
}

export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await store.findUserById(decoded.id);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    }
  }
  next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

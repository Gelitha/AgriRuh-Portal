// backend/src/middleware/authMiddleware.js
// Authentication & Authorization Middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is missing',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please refresh your token.',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }
};

/**
 * Check if user has required role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Check if user is admin or representative
 */
const requireAdminOrRep = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (!['admin', 'representative'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only admins and class representatives can access this resource',
      },
    });
  }

  next();
};

/**
 * Check if user is student
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only students can access this resource',
      },
    });
  }

  next();
};

/**
 * Check if user owns the resource or is admin
 */
const checkOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const resourceUserId = req.params.user_id || req.body.user_id;

  if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
  }

  next();
};

/**
 * Rate limiting middleware
 */
const rateLimit = (req, res, next) => {
  const redis = require('../config/redis');
  const ip = req.ip || req.connection.remoteAddress;
  const key = `rate_limit:${ip}`;
  const limit = 100; // requests
  const windowMs = 60 * 1000; // 1 minute

  redis.get(key, (err, count) => {
    if (err) {
      return next(); // Skip on Redis error
    }

    count = count ? parseInt(count, 10) : 0;

    if (count >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      });
    }

    redis.setex(key, Math.ceil(windowMs / 1000), count + 1);
    next();
  });
};

/**
 * Stricter rate limiting for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  const redis = require('../config/redis');
  const ip = req.ip || req.connection.remoteAddress;
  const key = `auth_rate_limit:${ip}`;
  const limit = 10; // requests
  const windowMs = 15 * 60 * 1000; // 15 minutes

  redis.get(key, (err, count) => {
    if (err) {
      return next();
    }

    count = count ? parseInt(count, 10) : 0;

    if (count >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many login attempts. Please try again in 15 minutes.',
        },
      });
    }

    redis.setex(key, Math.ceil(windowMs / 1000), count + 1);
    next();
  });
};

/**
 * Extract JWT token from request
 */
function extractToken(req) {
  // Check Authorization header (Bearer token)
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }

  // Check query parameter (for WebSocket)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

module.exports = {
  verifyToken,
  requireRole,
  requireAdminOrRep,
  requireStudent,
  checkOwnershipOrAdmin,
  rateLimit,
  authRateLimit,
  extractToken,
};

/**
 * Usage in routes:

const { verifyToken, requireRole, requireStudent } = require('../middleware/authMiddleware');

// Public route
router.post('/auth/login', authController.login);

// Protected route (any authenticated user)
router.get('/users/me', verifyToken, userController.getCurrentUser);

// Protected route (specific role)
router.post(
  '/sessions',
  verifyToken,
  requireRole('admin', 'representative'),
  sessionController.createSession
);

// Protected route (student only)
router.post(
  '/submissions',
  verifyToken,
  requireStudent,
  submissionController.createSubmission
);

 */

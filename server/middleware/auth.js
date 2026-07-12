const jwt = require('jsonwebtoken');

// In a real deployment this MUST come from an environment variable.
// Falling back to a dev secret keeps the hackathon build runnable out of the box.
const JWT_SECRET = process.env.JWT_SECRET || 'transitops-dev-secret-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Usage: requireRole('FleetManager', 'SafetyOfficer')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `This action requires one of the following roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };

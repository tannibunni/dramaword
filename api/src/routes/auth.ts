import express from 'express';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'test_jwt_token',
      user: {
        id: '1',
        username: 'test_user',
        email: 'test@example.com'
      }
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully'
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router; 
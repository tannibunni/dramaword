import express from 'express';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      username: 'test_user',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    }
  });
});

// PUT /api/users/profile
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
});

export default router; 
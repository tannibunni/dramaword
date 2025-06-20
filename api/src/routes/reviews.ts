import express from 'express';

const router = express.Router();

// GET /api/reviews
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      reviews: [],
      total: 0
    }
  });
});

// POST /api/reviews
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Review created successfully'
  });
});

// GET /api/reviews/stats
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalReviews: 0,
      accuracy: 0,
      streak: 0
    }
  });
});

export default router; 
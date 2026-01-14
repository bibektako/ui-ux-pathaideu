const express = require('express');
const Ad = require('../models/ad.model');

const router = express.Router();

// Public route to get active ads (no authentication required)
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .select('title file fileType link order');
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;








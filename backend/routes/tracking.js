const express = require('express');
const Package = require('../models/package.model');
const { authenticate } = require('../middleware/auth');
const { updateLocation, getTrackingHistory } = require('../services/tracking.service');

const router = express.Router();

router.use(authenticate);

router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const tracking = await updateLocation(id, lat, lng);
    res.json({ tracking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const history = await getTrackingHistory(req.params.id);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;





















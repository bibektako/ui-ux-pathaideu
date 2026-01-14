const express = require('express');
const Trip = require('../models/trip.model');
const { authenticate, requireVerified } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', requireVerified, async (req, res) => {
  try {
    const { origin, destination, departureDate, capacity, price } = req.body;

    if (!origin || !destination || !departureDate || !capacity || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const trip = new Trip({
      travellerId: req.user._id,
      origin,
      destination,
      departureDate: new Date(departureDate),
      capacity,
      price
    });

    await trip.save();
    await trip.populate('travellerId', 'name email phone rating');

    res.status(201).json({ trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, travellerId } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (travellerId) {
      query.travellerId = travellerId;
    } else if (req.user.role !== 'admin') {
      // Show user's own trips by default
      query.travellerId = req.user._id;
    }

    const trips = await Trip.find(query)
      .populate('travellerId', 'name email phone rating')
      .populate('acceptedPackages')
      .sort({ createdAt: -1 });

    res.json({ trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's trip history (completed and cancelled trips) - limit to 22 most recent
router.get('/history/mine', async (req, res) => {
  try {
    const trips = await Trip.find({
      travellerId: req.user._id,
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('travellerId', 'name email phone rating')
      .populate('acceptedPackages')
      .sort({ createdAt: -1 })
      .limit(22);

    res.json({ trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('travellerId', 'name email phone rating')
      .populate('acceptedPackages');

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireVerified, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.travellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(trip, req.body);
    await trip.save();
    await trip.populate('travellerId', 'name email phone rating');

    res.json({ trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireVerified, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.travellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    trip.status = 'cancelled';
    await trip.save();

    res.json({ message: 'Trip cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  travellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  destination: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  departureDate: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  acceptedPackages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Regular indexes for querying (not geospatial since we use Haversine formula)
tripSchema.index({ 'origin.coordinates.lat': 1, 'origin.coordinates.lng': 1 });
tripSchema.index({ 'destination.coordinates.lat': 1, 'destination.coordinates.lng': 1 });
tripSchema.index({ departureDate: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);














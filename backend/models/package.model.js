const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  travellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  code: {
    type: String,
    required: true,
    unique: true
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
  receiverName: {
    type: String,
    required: true
  },
  receiverPhone: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  photos: [{
    type: String
  }],
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  payer: {
    type: String,
    enum: ['sender', 'receiver'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed', 'expired'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded'],
    default: 'pending'
  },
  tracking: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  pickupProof: {
    type: String,
    default: null
  },
  deliveryProof: {
    type: String,
    default: null
  },
  deliveryOTP: {
    type: String,
    default: null
  },
  deliveryOTPExpiresAt: {
    type: Date,
    default: null
  },
  disputeReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  }
});

// Regular indexes for querying (not geospatial since we use Haversine formula)
packageSchema.index({ 'origin.coordinates.lat': 1, 'origin.coordinates.lng': 1 });
packageSchema.index({ 'destination.coordinates.lat': 1, 'destination.coordinates.lng': 1 });
packageSchema.index({ code: 1 });
packageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Package', packageSchema);














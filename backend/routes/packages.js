const express = require('express');
const Package = require('../models/package.model');
const Trip = require('../models/trip.model');
const { authenticate, requireVerified } = require('../middleware/auth');
const { findMatchingTrips } = require('../services/matching.service');
const { generateDeliveryOTP } = require('../services/tracking.service');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

const router = express.Router();

function generatePackageCode() {
  return 'PKG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

router.post('/', authenticate, requireVerified, async (req, res) => {
  try {
    const { origin, destination, receiverName, receiverPhone, description, fee, payer, photos } = req.body;

    if (!origin || !destination || !receiverName || !receiverPhone || !fee || !payer) {
      return res.status(400).json({ error: 'All required fields are missing' });
    }

    const code = generatePackageCode();
    const pkg = new Package({
      senderId: req.user._id,
      code,
      origin,
      destination,
      receiverName,
      receiverPhone,
      description: description || '',
      fee,
      payer,
      photos: photos || []
    });

    await pkg.save();

    await pkg.populate('senderId', 'name email phone profileImage');
    res.status(201).json({ package: pkg });

    // Notify sender about package creation
    try {
      await notificationService.create(
        req.user._id,
        'Package created',
        `Your package ${code} has been created.`,
        'package_created',
        { packageId: pkg._id, code }
      );
      console.log('✅ Notification created for package creation');
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List packages (default: current user's own packages)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, senderId, travellerId } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (senderId) {
      query.senderId = senderId;
    } else if (req.user.role !== 'admin') {
      // Show user's own packages by default
      query.senderId = req.user._id;
    }

    if (travellerId) {
      query.travellerId = travellerId;
    }

    const packages = await Package.find(query)
      .populate('senderId', 'name email phone profileImage')
      .populate('travellerId', 'name email phone profileImage')
      .populate('tripId')
      .sort({ createdAt: -1 });

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// History for the current user (as sender or traveller) - limit to 22 most recent
router.get('/history/mine', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status ? { status } : {};

    const packages = await Package.find({
      ...statusFilter,
      $or: [{ senderId: req.user._id }, { travellerId: req.user._id }]
    })
      .populate('senderId', 'name email phone profileImage')
      .populate('travellerId', 'name email phone profileImage')
      .populate('tripId')
      .sort({ createdAt: -1 })
      .limit(22);

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Available packages for travellers (pending, not yet taken), filterable by destination text
router.get('/available/search', authenticate, async (req, res) => {
  try {
    const { destination } = req.query;
    const query = {
      status: 'pending',
      travellerId: null
    };

    if (destination) {
      const regex = new RegExp(destination, 'i');
      query.$or = [
        { 'destination.city': regex },
        { 'destination.address': regex }
      ];
    }

    const packages = await Package.find(query)
      .populate('senderId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate('senderId', 'name email phone profileImage')
      .populate('travellerId', 'name email phone profileImage')
      .populate('tripId');

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: pkg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/code/:code', async (req, res) => {
  try {
    const code = req.params.code || '';
    let pkg = await Package.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } })
      .populate('senderId', 'name email phone profileImage')
      .populate('travellerId', 'name email phone profileImage');

    // Fallback: allow searching by ObjectId as well
    if (!pkg && code && code.length === 24) {
      pkg = await Package.findById(code)
        .populate('senderId', 'name email phone')
        .populate('travellerId', 'name email phone');
    }

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: pkg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/matches', authenticate, async (req, res) => {
  try {
    const matches = await findMatchingTrips(req.params.id);
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/accept', authenticate, requireVerified, async (req, res) => {
  try {
    const { tripId } = req.body;
    const pkg = await Package.findById(req.params.id);
    const trip = await Trip.findById(tripId);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (pkg.status !== 'pending') {
      return res.status(400).json({ error: 'Package already accepted or not available' });
    }

    // Prevent users from accepting their own packages
    if (pkg.senderId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot accept your own package' });
    }

    if (trip.travellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only allow accepting packages to active trips
    if (trip.status !== 'active') {
      return res.status(400).json({ error: 'Cannot accept packages to a completed or cancelled trip. Please create a new trip.' });
    }

    if (trip.acceptedPackages.length >= trip.capacity) {
      return res.status(400).json({ error: 'Trip capacity full' });
    }

    pkg.travellerId = req.user._id;
    pkg.tripId = trip._id;
    pkg.status = 'accepted';
    pkg.deliveryOTP = generateDeliveryOTP();
    await pkg.save();

    trip.acceptedPackages.push(pkg._id);
    await trip.save();

    await pkg.populate('senderId', 'name email phone profileImage');
    await pkg.populate('travellerId', 'name email phone');

    res.json({ package: pkg, message: 'Package accepted' });

    // Notify sender and traveller
    try {
      await notificationService.bulkCreate(
        [pkg.senderId._id || pkg.senderId, req.user._id],
        'Package accepted',
        `Package ${pkg.code} has been accepted.`,
        'package_accepted',
        { packageId: pkg._id, code: pkg.code }
      );
      console.log('✅ Notifications created for package acceptance');
    } catch (notifError) {
      console.error('❌ Error creating notifications:', notifError);
      // Don't fail the request if notification fails
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pickup', authenticate, requireVerified, async (req, res) => {
  try {
    const { pickupProof } = req.body;
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.travellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (pkg.status !== 'accepted') {
      return res.status(400).json({ error: 'Package not in accepted state' });
    }

    pkg.status = 'picked_up';
    pkg.pickedUpAt = new Date();
    if (pickupProof) {
      pkg.pickupProof = pickupProof;
    }
    await pkg.save();

    res.json({ package: pkg, message: 'Package picked up' });

    // Notify sender and traveller
    try {
      await notificationService.bulkCreate(
        [pkg.senderId, pkg.travellerId],
        'Package picked up',
        `Package ${pkg.code} has been picked up.`,
        'package_status',
        { packageId: pkg._id, code: pkg.code, status: 'picked_up' }
      );
      console.log('✅ Notifications created for package pickup');
    } catch (notifError) {
      console.error('❌ Error creating notifications:', notifError);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Traveller marks package as delivered - sends OTP to sender
router.post('/:id/deliver', authenticate, requireVerified, async (req, res) => {
  try {
    const { deliveryProof } = req.body;
    const pkg = await Package.findById(req.params.id).populate('senderId', 'name email');

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.travellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!['picked_up', 'in_transit'].includes(pkg.status)) {
      return res.status(400).json({ error: 'Package not ready for delivery' });
    }

    // Generate new OTP for delivery verification
    const deliveryOTP = generateDeliveryOTP();
    pkg.deliveryOTP = deliveryOTP;
    pkg.deliveryOTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    if (deliveryProof) {
      pkg.deliveryProof = deliveryProof;
    }
    await pkg.save();

    // Send OTP to sender's email
    try {
      const sender = pkg.senderId;
      if (sender && sender.email) {
        await emailService.sendDeliveryOTP(sender.email, deliveryOTP, pkg.code);
        console.log(`✅ Delivery OTP sent to sender: ${sender.email}`);
      } else {
        console.warn('⚠️ Sender email not found, cannot send OTP');
      }
    } catch (emailError) {
      console.error('❌ Error sending delivery OTP email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    // Notify sender that package is pending verification
    try {
      await notificationService.create(
        pkg.senderId._id || pkg.senderId,
        'Package delivery pending verification',
        `Package ${pkg.code} has been marked as delivered. Please verify with the OTP sent to your email.`,
        'package_status',
        { packageId: pkg._id, code: pkg.code, status: 'pending_verification' }
      );
      console.log('✅ Notification created for pending verification');
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError);
    }

    res.json({ 
      package: pkg, 
      message: 'Delivery OTP sent to sender. Package will be marked as delivered after sender verification.' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sender verifies delivery OTP and confirms delivery
router.post('/:id/verify-delivery', authenticate, requireVerified, async (req, res) => {
  try {
    const { otp } = req.body;
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Check if user is the sender
    if (pkg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the sender can verify delivery' });
    }

    // Check if OTP exists and is valid
    if (!pkg.deliveryOTP) {
      return res.status(400).json({ error: 'No delivery OTP found. Please ask the traveller to mark the package as delivered first.' });
    }

    // Check if OTP is expired
    if (pkg.deliveryOTPExpiresAt && new Date() > pkg.deliveryOTPExpiresAt) {
      return res.status(400).json({ error: 'Delivery OTP has expired. Please ask the traveller to mark the package as delivered again.' });
    }

    // Verify OTP
    if (otp !== pkg.deliveryOTP) {
      return res.status(400).json({ error: 'Invalid OTP. Please check the code sent to your email.' });
    }

    // Mark package as delivered
    pkg.status = 'delivered';
    pkg.deliveredAt = new Date();
    pkg.deliveryOTP = null; // Clear OTP after successful verification
    pkg.deliveryOTPExpiresAt = null;
    await pkg.save();

    // Check if trip should be marked as completed
    if (pkg.tripId) {
      const trip = await Trip.findById(pkg.tripId);
      if (trip && trip.status === 'active') {
        // Get all packages for this trip
        const tripPackages = await Package.find({ tripId: trip._id });
        // Check if all packages are delivered
        const allDelivered = tripPackages.every(p => p.status === 'delivered');
        if (allDelivered && tripPackages.length > 0) {
          trip.status = 'completed';
          await trip.save();
          console.log(`✅ Trip ${trip._id} marked as completed - all packages delivered`);
        }
      }
    }

    // Update traveller stats
    const User = require('../models/user.model');
    const traveller = await User.findById(pkg.travellerId);
    if (traveller) {
      traveller.totalDeliveries += 1;
      await traveller.save();
    }

    // Update sender stats
    const sender = await User.findById(pkg.senderId);
    if (sender) {
      sender.totalPackages += 1;
      await sender.save();
    }

    // Notify both sender and traveller
    try {
      await notificationService.bulkCreate(
        [pkg.senderId, pkg.travellerId],
        'Package delivered',
        `Package ${pkg.code} has been verified and delivered successfully.`,
        'package_status',
        { packageId: pkg._id, code: pkg.code, status: 'delivered' }
      );
      console.log('✅ Notifications created for verified delivery');
    } catch (notifError) {
      console.error('❌ Error creating notifications:', notifError);
    }

    res.json({ package: pkg, message: 'Package delivery verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/dispute', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const isSender = pkg.senderId.toString() === req.user._id.toString();
    const isTraveller = pkg.travellerId && pkg.travellerId.toString() === req.user._id.toString();

    if (!isSender && !isTraveller) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    pkg.status = 'disputed';
    pkg.disputeReason = reason;
    await pkg.save();

    res.json({ package: pkg, message: 'Dispute raised' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update package - only sender can update their own packages
router.put('/:id', authenticate, requireVerified, async (req, res) => {
  try {
    const { origin, destination, receiverName, receiverPhone, description, fee, payer, photos } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !receiverName || !receiverPhone || fee === undefined || !payer) {
      return res.status(400).json({ error: 'All required fields must be provided: origin, destination, receiverName, receiverPhone, fee, and payer.' });
    }

    // Validate fee is a positive number
    if (typeof fee !== 'number' || fee < 0) {
      return res.status(400).json({ error: 'Fee must be a positive number.' });
    }

    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found. The package you are trying to update does not exist.' });
    }

    // Only the sender can update their package
    if (pkg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to update this package. Only the package sender can make updates.' });
    }

    // Only allow updating pending or expired packages
    if (!['pending', 'expired'].includes(pkg.status)) {
      return res.status(400).json({ 
        error: `Cannot update package. This package is currently ${pkg.status} and cannot be modified. Only pending or expired packages can be updated.` 
      });
    }

    // Update package fields
    if (origin) {
      pkg.origin = origin;
    }
    if (destination) {
      pkg.destination = destination;
    }
    if (receiverName) {
      pkg.receiverName = receiverName;
    }
    if (receiverPhone) {
      pkg.receiverPhone = receiverPhone;
    }
    if (description !== undefined) {
      pkg.description = description;
    }
    if (fee !== undefined) {
      pkg.fee = fee;
    }
    if (payer) {
      pkg.payer = payer;
    }
    if (photos) {
      pkg.photos = photos;
    }
    // Reset status to pending if it was expired
    if (pkg.status === 'expired') {
      pkg.status = 'pending';
    }

    await pkg.save();

    await pkg.populate('senderId', 'name email phone profileImage');
    res.json({ package: pkg, message: 'Package updated successfully' });
  } catch (error) {
    console.error('Error updating package:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Invalid package data. Please check all fields and try again.' 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid package ID format. Please check the package ID and try again.' 
      });
    }

    // Generic error message for users
    res.status(500).json({ 
      error: 'Failed to update package. Please try again later. If the problem persists, contact support.' 
    });
  }
});

// Delete package - only sender can delete their own packages
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found. The package you are trying to delete does not exist.' });
    }

    // Only the sender can delete their package
    if (pkg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to delete this package. Only the package sender can delete it.' });
    }

    // Only allow deletion of pending or expired packages
    if (!['pending', 'expired'].includes(pkg.status)) {
      return res.status(400).json({ 
        error: `Cannot delete package. This package is currently ${pkg.status} and cannot be deleted. Only pending or expired packages can be deleted.` 
      });
    }

    await Package.findByIdAndDelete(req.params.id);

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid package ID format. Please check the package ID and try again.' 
      });
    }

    // Generic error message for users
    res.status(500).json({ 
      error: 'Failed to delete package. Please try again later. If the problem persists, contact support.' 
    });
  }
});

module.exports = router;


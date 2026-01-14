const Package = require('../models/package.model');

async function updateLocation(packageId, lat, lng) {
  const pkg = await Package.findById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  if (!['accepted', 'picked_up', 'in_transit'].includes(pkg.status)) {
    throw new Error('Package not in trackable state');
  }

  pkg.tracking.push({
    lat,
    lng,
    timestamp: new Date()
  });

  // Keep only last 100 tracking points
  if (pkg.tracking.length > 100) {
    pkg.tracking = pkg.tracking.slice(-100);
  }

  await pkg.save();
  return pkg.tracking;
}

async function getTrackingHistory(packageId) {
  const pkg = await Package.findById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  return pkg.tracking || [];
}

function generateDeliveryOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  updateLocation,
  getTrackingHistory,
  generateDeliveryOTP
};





















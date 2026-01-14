const Trip = require('../models/trip.model');
const Package = require('../models/package.model');
const { haversineDistance, isWithinRadius } = require('../utils/gps');
const { matchCity } = require('../utils/fuzzy');
const config = require('../config');

async function findMatchingTrips(packageId) {
  const pkg = await Package.findById(packageId).populate('senderId');
  if (!pkg || pkg.status !== 'pending') {
    return [];
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + config.MATCHING_DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const trips = await Trip.find({
    status: 'active',
    departureDate: { $gte: now, $lte: futureDate }
  }).populate('travellerId');

  const matches = [];

  for (const trip of trips) {
    const originDistance = haversineDistance(
      pkg.origin.coordinates.lat,
      pkg.origin.coordinates.lng,
      trip.origin.coordinates.lat,
      trip.origin.coordinates.lng
    );

    const destDistance = haversineDistance(
      pkg.destination.coordinates.lat,
      pkg.destination.coordinates.lng,
      trip.destination.coordinates.lat,
      trip.destination.coordinates.lng
    );

    const cityMatch = matchCity(pkg.origin.city, trip.origin.city) && 
                      matchCity(pkg.destination.city, trip.destination.city);

    const withinRadius = originDistance <= config.MATCHING_DISTANCE_THRESHOLD &&
                         destDistance <= config.MATCHING_DISTANCE_THRESHOLD;

    if (cityMatch || withinRadius) {
      const availableCapacity = trip.capacity - trip.acceptedPackages.length;
      if (availableCapacity > 0) {
        matches.push({
          trip,
          score: calculateMatchScore(originDistance, destDistance, cityMatch, availableCapacity),
          originDistance,
          destDistance,
          availableCapacity
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function calculateMatchScore(originDist, destDist, cityMatch, capacity) {
  let score = 100;
  score -= originDist * 2;
  score -= destDist * 2;
  if (cityMatch) score += 20;
  score += capacity * 5;
  return Math.max(0, score);
}

async function findMatchingPackages(tripId) {
  const trip = await Trip.findById(tripId).populate('travellerId');
  if (!trip || trip.status !== 'active') {
    return [];
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + config.MATCHING_DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  if (trip.departureDate > futureDate) {
    return [];
  }

  const packages = await Package.find({
    status: 'pending',
    travellerId: null
  }).populate('senderId');

  const matches = [];
  const availableCapacity = trip.capacity - trip.acceptedPackages.length;

  for (const pkg of packages) {
    const originDistance = haversineDistance(
      pkg.origin.coordinates.lat,
      pkg.origin.coordinates.lng,
      trip.origin.coordinates.lat,
      trip.origin.coordinates.lng
    );

    const destDistance = haversineDistance(
      pkg.destination.coordinates.lat,
      pkg.destination.coordinates.lng,
      trip.destination.coordinates.lat,
      trip.destination.coordinates.lng
    );

    const cityMatch = matchCity(pkg.origin.city, trip.origin.city) && 
                      matchCity(pkg.destination.city, trip.destination.city);

    const withinRadius = originDistance <= config.MATCHING_DISTANCE_THRESHOLD &&
                         destDistance <= config.MATCHING_DISTANCE_THRESHOLD;

    if ((cityMatch || withinRadius) && availableCapacity > 0) {
      matches.push({
        package: pkg,
        score: calculateMatchScore(originDistance, destDistance, cityMatch, availableCapacity),
        originDistance,
        destDistance
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

module.exports = {
  findMatchingTrips,
  findMatchingPackages
};





















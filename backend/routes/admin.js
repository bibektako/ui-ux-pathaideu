const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user.model');
const Package = require('../models/package.model');
const Trip = require('../models/trip.model');
const Transaction = require('../models/transaction.model');
const Submission = require('../models/submission.model');
const Ad = require('../models/ad.model');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getUploadPath, generateFileName } = require('../utils/storage');
const config = require('../config');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Configure multer for ad uploads
const adStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadPath('ads'));
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname, `ad_${Date.now()}_`);
    cb(null, fileName);
  }
});

const adFileFilter = (req, file, cb) => {
  if (config.ALLOWED_AD_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, GIFs, and videos (MP4) are allowed.'), false);
  }
};

const adUpload = multer({
  storage: adStorage,
  limits: { 
    fileSize: config.MAX_VIDEO_SIZE // Allow up to 10MB for videos
  },
  fileFilter: adFileFilter
});

router.get('/pending-verifications', async (req, res) => {
  try {
    const submissions = await Submission.find({
      type: 'id_verification',
      status: 'pending'
    }).populate('userId', 'name email phone profileImage');

    // Filter to only include users with profile pictures
    const validSubmissions = submissions.filter(sub => sub.userId?.profileImage);

    res.json({ users: validSubmissions.map(sub => sub.userId), submissions: validSubmissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.verified = verified === true;
    await user.save();

    // Update submission status
    const submission = await Submission.findOne({
      userId,
      type: 'id_verification',
      status: 'pending'
    });

    if (submission) {
      submission.status = verified ? 'approved' : 'rejected';
      submission.reviewedBy = req.user._id;
      submission.reviewedAt = new Date();
      await submission.save();
    }

    res.json({ message: `User ${verified ? 'verified' : 'rejected'}`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPackages = await Package.countDocuments();
    const totalTrips = await Trip.countDocuments();
    
    const activePackages = await Package.countDocuments({ status: { $in: ['pending', 'accepted', 'picked_up', 'in_transit'] } });
    const completedPackages = await Package.countDocuments({ status: 'delivered' });

    res.json({
      users: { total: totalUsers },
      packages: { total: totalPackages, active: activePackages, completed: completedPackages },
      trips: { total: totalTrips }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ad Management Routes
router.post('/ads', adUpload.single('file'), async (req, res) => {
  try {
    const { title, link } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Determine file type
    let fileType = 'image';
    if (req.file.mimetype === 'image/gif') {
      fileType = 'gif';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }

    const filePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    // Get current max order
    const maxOrderAd = await Ad.findOne().sort({ order: -1 });
    const nextOrder = maxOrderAd ? maxOrderAd.order + 1 : 0;

    const ad = new Ad({
      title: title || 'Ad',
      file: filePath,
      fileType,
      link: link || null,
      active: true,
      order: nextOrder,
      createdBy: req.user._id
    });

    await ad.save();
    res.status(201).json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ads', async (req, res) => {
  try {
    const ads = await Ad.find().sort({ order: 1, createdAt: -1 }).populate('createdBy', 'name');
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, active, order } = req.body;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    if (title !== undefined) ad.title = title;
    if (link !== undefined) ad.link = link;
    if (active !== undefined) ad.active = active;
    if (order !== undefined) ad.order = order;
    ad.updatedAt = new Date();

    await ad.save();
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;










const express = require('express');
const multer = require('multer');
const path = require('path');
const Submission = require('../models/submission.model');
const User = require('../models/user.model');
const { authenticate } = require('../middleware/auth');
const { getUploadPath, generateFileName } = require('../utils/storage');
const config = require('../config');
const notificationService = require('../services/notification.service');

const router = express.Router();

router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadType = 'package';
    if (req.body.type === 'id_verification') {
      uploadType = 'id';
    } else if (req.body.type === 'traveller_photo') {
      uploadType = 'traveller';
    }
    cb(null, getUploadPath(uploadType));
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname, `${req.user._id}_`);
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter
});

router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    const { type, packageId, metadata } = req.body;

    if (!type || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Type and files are required' });
    }

    const filePaths = req.files.map(file => 
      path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/')
    );

    const submission = new Submission({
      userId: req.user._id,
      type,
      packageId: packageId || null,
      files: filePaths,
      metadata: metadata ? JSON.parse(metadata) : {}
    });

    await submission.save();

    // If ID verification, update user model
    if (type === 'id_verification') {
      const user = await User.findById(req.user._id);
      user.idImage = filePaths[0];
      await user.save();
      try {
        await notificationService.create(
          req.user._id,
          'ID submitted for verification',
          'We received your ID. Our team will review it shortly.',
          'id_submitted',
          { submissionId: submission._id }
        );
        console.log('✅ Notification created for ID submission');
      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
      }
    } else if (type === 'traveller_photo') {
      // If this is a profile / traveller photo, update profileImage on the user
      const user = await User.findById(req.user._id);
      user.profileImage = filePaths[0];
      await user.save();
    }

    res.status(201).json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, status, packageId } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (packageId) {
      query.packageId = packageId;
    }

    const submissions = await Submission.find(query)
      .populate('userId', 'name email')
      .populate('packageId', 'code')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('packageId', 'code')
      .populate('reviewedBy', 'name');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;











const express = require('express');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List notifications for current user (limit to 22 most recent)
router.get('/', async (req, res) => {
  try {
    // First, check total count to see if we need to delete
    const totalCount = await Notification.countDocuments({ userId: req.user._id });
    
    // Get the 22 most recent notifications
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(22)
      .lean();
    
    // Auto-delete notifications beyond the 22 most recent
    if (totalCount > 22 && notifications.length > 0) {
      // Get the oldest notification from the 22 we're keeping
      const oldestKeptNotification = notifications[notifications.length - 1];
      
      // Delete all notifications older than the oldest kept one
      const deleteResult = await Notification.deleteMany({
        userId: req.user._id,
        createdAt: { $lt: oldestKeptNotification.createdAt }
      });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`✅ Auto-deleted ${deleteResult.deletedCount} old notification(s) for user ${req.user._id}`);
      }
    }
    
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
router.post('/read/:id', async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: broadcast offer notification to all users
router.post('/offer', requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    const users = await User.find({}, '_id');
    const docs = users.map((u) => ({
      userId: u._id,
      title,
      message,
      type: 'offer',
      meta: {}
    }));
    await Notification.insertMany(docs);
    res.status(201).json({ message: 'Offer notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;







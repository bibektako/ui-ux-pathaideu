const Notification = require('../models/notification.model');
const mongoose = require('mongoose');

// Helper to extract ObjectId from user object or ObjectId
const extractUserId = (user) => {
  if (!user) return null;
  if (mongoose.Types.ObjectId.isValid(user)) return user;
  if (user._id) return user._id;
  if (user.toString) return user.toString();
  return user;
};

const notificationService = {
  async create(userId, title, message, type = 'package_status', meta = {}) {
    const extractedId = extractUserId(userId);
    if (!extractedId) {
      console.warn('⚠️ Notification create: Invalid userId', userId);
      return null;
    }
    try {
      const note = new Notification({ userId: extractedId, title, message, type, meta });
      await note.save();
      console.log(`✅ Notification created for user ${extractedId}: ${title}`);
      return note;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  async bulkCreate(userIds = [], title, message, type = 'package_status', meta = {}) {
    const filtered = (userIds || []).filter(Boolean);
    if (filtered.length === 0) {
      console.warn('⚠️ Notification bulkCreate: No valid userIds provided');
      return [];
    }
    
    const docs = filtered
      .map(extractUserId)
      .filter(Boolean)
      .map((uid) => ({
        userId: uid,
        title,
        message,
        type,
        meta
      }));
    
    if (docs.length === 0) {
      console.warn('⚠️ Notification bulkCreate: No valid userIds after extraction');
      return [];
    }
    
    try {
      const result = await Notification.insertMany(docs);
      console.log(`✅ Created ${result.length} notifications: ${title}`);
      return result;
    } catch (error) {
      console.error('❌ Error bulk creating notifications:', error);
      throw error;
    }
  }
};

module.exports = notificationService;






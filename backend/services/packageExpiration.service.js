const Package = require('../models/package.model');
const notificationService = require('./notification.service');

const packageExpirationService = {
  /**
   * Check for packages that should be expired (1 day old, pending, not picked up)
   * and mark them as expired, then send notifications
   */
  async checkAndExpirePackages() {
    try {
      // Calculate the date 1 day ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Find packages that:
      // 1. Are in 'pending' status
      // 2. Have no travellerId (not accepted)
      // 3. Were created more than 1 day ago
      const expiredPackages = await Package.find({
        status: 'pending',
        travellerId: null,
        createdAt: { $lte: oneDayAgo }
      }).populate('senderId', 'name email');

      if (expiredPackages.length === 0) {
        console.log('✅ No packages to expire');
        return { expired: 0, notifications: 0 };
      }

      console.log(`📦 Found ${expiredPackages.length} package(s) to expire`);

      // Mark packages as expired
      const packageIds = expiredPackages.map(pkg => pkg._id);
      const updateResult = await Package.updateMany(
        { _id: { $in: packageIds } },
        { $set: { status: 'expired' } }
      );

      console.log(`✅ Marked ${updateResult.modifiedCount} package(s) as expired`);

      // Send notifications to senders
      let notificationCount = 0;
      for (const pkg of expiredPackages) {
        try {
          await notificationService.create(
            pkg.senderId._id || pkg.senderId,
            'Package Expired',
            `Your package ${pkg.code} has expired as no traveller picked it up within 24 hours.`,
            'package_status',
            { packageId: pkg._id, code: pkg.code, status: 'expired' }
          );
          notificationCount++;
        } catch (notifError) {
          console.error(`❌ Error creating notification for package ${pkg.code}:`, notifError);
        }
      }

      console.log(`✅ Sent ${notificationCount} expiration notification(s)`);

      return {
        expired: updateResult.modifiedCount,
        notifications: notificationCount
      };
    } catch (error) {
      console.error('❌ Error checking and expiring packages:', error);
      throw error;
    }
  }
};

module.exports = packageExpirationService;


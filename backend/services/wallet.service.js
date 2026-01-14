const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const Package = require('../models/package.model');

async function topUpWallet(userId, amount) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.walletBalance += amount;
  await user.save();

  const transaction = new Transaction({
    senderId: userId,
    amount,
    type: 'topup',
    status: 'completed',
    description: `Wallet top-up of Rs ${amount}`,
    completedAt: new Date()
  });
  await transaction.save();

  return { balance: user.walletBalance, transaction };
}

async function holdFunds(packageId, userId) {
  const pkg = await Package.findById(packageId).populate('senderId');
  if (!pkg) {
    throw new Error('Package not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (pkg.payer !== 'sender' || userId.toString() !== pkg.senderId._id.toString()) {
    throw new Error('Invalid payer');
  }

  if (user.walletBalance < pkg.fee) {
    throw new Error('Insufficient balance');
  }

  user.walletBalance -= pkg.fee;
  await user.save();

  pkg.paymentStatus = 'held';
  await pkg.save();

  const transaction = new Transaction({
    packageId: pkg._id,
    senderId: userId,
    amount: pkg.fee,
    type: 'hold',
    status: 'completed',
    description: `Held Rs ${pkg.fee} for package ${pkg.code}`,
    completedAt: new Date()
  });
  await transaction.save();

  return { balance: user.walletBalance, transaction };
}

async function releaseFunds(packageId, adminId = null) {
  const pkg = await Package.findById(packageId).populate('travellerId');
  if (!pkg) {
    throw new Error('Package not found');
  }

  if (pkg.paymentStatus !== 'held') {
    throw new Error('Funds not held');
  }

  if (!pkg.travellerId) {
    throw new Error('No traveller assigned');
  }

  const traveller = await User.findById(pkg.travellerId._id);
  traveller.walletBalance += pkg.fee;
  await traveller.save();

  pkg.paymentStatus = 'released';
  await pkg.save();

  const transaction = await Transaction.findOne({
    packageId: pkg._id,
    type: 'hold',
    status: 'completed'
  });

  if (transaction) {
    transaction.travellerId = traveller._id;
    await transaction.save();
  }

  const releaseTransaction = new Transaction({
    packageId: pkg._id,
    senderId: pkg.senderId,
    travellerId: traveller._id,
    amount: pkg.fee,
    type: 'release',
    status: 'completed',
    description: `Released Rs ${pkg.fee} to traveller for package ${pkg.code}`,
    completedAt: new Date()
  });
  await releaseTransaction.save();

  return { transaction: releaseTransaction, travellerBalance: traveller.walletBalance };
}

async function refundFunds(packageId, adminId = null) {
  const pkg = await Package.findById(packageId).populate('senderId');
  if (!pkg) {
    throw new Error('Package not found');
  }

  if (pkg.paymentStatus !== 'held') {
    throw new Error('Funds not held');
  }

  const sender = await User.findById(pkg.senderId._id);
  sender.walletBalance += pkg.fee;
  await sender.save();

  pkg.paymentStatus = 'refunded';
  await pkg.save();

  const refundTransaction = new Transaction({
    packageId: pkg._id,
    senderId: sender._id,
    amount: pkg.fee,
    type: 'refund',
    status: 'completed',
    description: `Refunded Rs ${pkg.fee} to sender for package ${pkg.code}`,
    completedAt: new Date()
  });
  await refundTransaction.save();

  return { transaction: refundTransaction, senderBalance: sender.walletBalance };
}

module.exports = {
  topUpWallet,
  holdFunds,
  releaseFunds,
  refundFunds
};















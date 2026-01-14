const express = require('express');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { authenticate } = require('../middleware/auth');
const { topUpWallet, holdFunds, releaseFunds, refundFunds } = require('../services/wallet.service');

const router = express.Router();

router.use(authenticate);

router.post('/topup', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const result = await topUpWallet(req.user._id, amount);
    res.json({ message: 'Wallet topped up', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hold', async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    const result = await holdFunds(packageId, req.user._id);
    res.json({ message: 'Funds held', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/release', async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    const result = await releaseFunds(packageId);
    res.json({ message: 'Funds released', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refund', async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    const result = await refundFunds(packageId);
    res.json({ message: 'Funds refunded', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { senderId: req.user._id },
        { travellerId: req.user._id }
      ]
    })
      .populate('packageId', 'code')
      .populate('senderId', 'name email')
      .populate('travellerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;





















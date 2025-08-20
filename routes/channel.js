const express = require('express');
const authMiddleware = require('../middleware/auth');
const Channel = require('../models/channel');
const router = express.Router();

// ------------------------------------------------
// POST /api/channels  – create a channel (auth required)
// ------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });

    const channel = new Channel({
      name,
      description: description || '',
      owner: req.user._id,
    });

    await channel.save();
    res.status(201).json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------
// GET /api/channels/me  – my channels (auth required)
// ------------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const channels = await Channel.find({ owner: req.user._id })
      .select('-__v')
      .sort({ createdAt: -1 });
    res.json(channels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------
// GET /api/channels  – list all channels (public)
// ------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find()
      .select('-__v')
      .populate('owner', 'firstName lastName username') // only public fields
      .sort({ createdAt: -1 });
    res.json(channels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------
// GET /api/channels/:id  – single channel by id (public)
// ------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .select('-__v')
      .populate('owner', 'firstName lastName username');

    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

















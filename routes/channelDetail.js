/*const express = require('express');
const authMiddleware = require('../middleware/auth');
const Update = require('../models/update');
const Channel = require('../models/channel');
const router = express.Router();

// ------------------------------------------------
// GET /api/channels/:id/updates
// ------------------------------------------------
router.get('/:id/updates', async (req, res) => {
  try {
    const updates = await Update.find({ channel: req.params.id })
      .populate('author', 'firstName lastName username')
      .sort({ createdAt: 1 });
    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------
// POST /api/channels/:id/updates  (owner only)
// ------------------------------------------------
router.post('/:id/updates', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // only owner can post
    if (!channel.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const update = new Update({
      channel: channel._id,
      author: req.user._id,
      content: content.trim(),
    });

    await update.save();
    await update.populate('author', 'firstName lastName username');
    res.status(201).json(update);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;*/

// routes/channelDetail.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const Update = require('../models/update');
const Channel = require('../models/channel');
const router = express.Router();

// GET /api/channels/:id/updates
router.get('/:id/updates', async (req, res) => {
  try {
    const updates = await Update.find({ channel: req.params.id })
      .populate('author', 'firstName lastName username')
      .sort({ createdAt: 1 });
    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/channels/:id/updates (owner only)
router.post('/:id/updates', authMiddleware, async (req, res) => {
  try {
    const { content, musicAttachment } = req.body;
    
    // Require either content or musicAttachment
    if (!content?.trim() && !musicAttachment) {
      return res.status(400).json({ message: 'Content or music attachment required' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // Only owner can post
    if (!channel.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const updateData = {
      channel: channel._id,
      author: req.user._id,
      content: content?.trim() || '',
    };

    // Add music attachment if provided
    if (musicAttachment) {
      updateData.musicAttachment = {
        videoId: musicAttachment.videoId,
        title: musicAttachment.title,
        artist: musicAttachment.artist,
        thumbnailUrl: musicAttachment.thumbnailUrl,
        duration: musicAttachment.duration,
      };
    }

    const update = new Update(updateData);
    await update.save();
    await update.populate('author', 'firstName lastName username');
    res.status(201).json(update);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
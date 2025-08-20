/*const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', updateSchema);*/

// models/update.js
const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    musicAttachment: {
      videoId: {
        type: String,
        trim: true,
      },
      title: {
        type: String,
        trim: true,
      },
      artist: {
        type: String,
        trim: true,
      },
      thumbnailUrl: {
        type: String,
        trim: true,
      },
      duration: {
        type: Number, 
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', updateSchema);
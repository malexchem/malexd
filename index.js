require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const sneepRoutes = require('./routes/sneep');
const app = express();

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Set the path to ffmpeg.exe
ffmpeg.setFfmpegPath(path.join(__dirname, 'ffmpeg', 'ffmpeg.exe'));

// Optional: If you need ffprobe
ffmpeg.setFfprobePath(path.join(__dirname, 'ffmpeg', 'ffprobe.exe'));

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sneeps', sneepRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
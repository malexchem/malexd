const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Sneep = require('../models/sneep');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

ffmpeg.setFfmpegPath(path.join(__dirname, '../ffmpeg/ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(__dirname, '../ffmpeg/ffprobe.exe'));

// BunnyCDN Configuration
const BUNNY_CONFIG = {
  storageZone: 'mizzo',
  apiKey: process.env.BUNNY_API_KEY,
  storageHost: 'jh.storage.bunnycdn.com',
  pullZone: 'mizzo.b-cdn.net'
};


// Upload to BunnyCDN
const uploadToBunny = async (filePath, fileName, mimeType) => {
  const uploadUrl = `https://${BUNNY_CONFIG.storageHost}/${BUNNY_CONFIG.storageZone}/${fileName}`;
  
  try {
    const fileData = fs.readFileSync(filePath);
    await axios.put(uploadUrl, fileData, {
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey,
        'Content-Type': mimeType,
      },
    });

    return `https://${BUNNY_CONFIG.pullZone}/${fileName}`;
  } catch (error) {
    console.error('BunnyCDN upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to BunnyCDN');
  }
};


// Generate thumbnail from video
/*const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01.000'],
        filename: 'thumbnail.png',
        folder: path.dirname(thumbnailPath),
        size: '640x360'
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
};*/
const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(thumbnailPath) // ⬅️ write directly to the correct path
      .frames(1)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};


// Get video duration
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

// Upload Sneep
exports.uploadSneep = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    //const file = req.file;
    const file = req.files?.['video']?.[0];
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process video
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `sneep_${Date.now()}${fileExt}`;
    const filePath = path.join(tempDir, fileName);
    await writeFileAsync(filePath, fs.readFileSync(file.path));

    // Generate thumbnail
    const thumbnailName = `thumbnail_${Date.now()}.png`;
    const thumbnailPath = path.join(tempDir, thumbnailName);
    await generateThumbnail(filePath, thumbnailPath);

    // Get duration
    const duration = await getVideoDuration(filePath);

    // Upload files to BunnyCDN
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToBunny(filePath, fileName, file.mimetype),
      uploadToBunny(thumbnailPath, thumbnailName, 'image/png')
    ]);

    // Save to MongoDB
    const sneep = new Sneep({
      title,
      description,
      url: videoUrl,
      thumbnailUrl,
      duration,
      user: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await sneep.save();

    // Clean up temp files
    await Promise.all([
      unlinkAsync(filePath),
      unlinkAsync(thumbnailPath),
      unlinkAsync(file.path)
    ]);

    res.status(201).json(sneep);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all Sneeps
exports.getSneeps = async (req, res) => {
  try {
    const sneeps = await Sneep.find()
      .populate('user', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(sneeps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Sneep by ID
exports.getSneep = async (req, res) => {
  try {
    const sneep = await Sneep.findById(req.params.id)
      .populate('user', 'firstName lastName username')
      .populate('comments.user', 'firstName lastName username');

    if (!sneep) {
      return res.status(404).json({ error: 'Sneep not found' });
    }

    // Increment view count
    sneep.views += 1;
    await sneep.save();

    res.json(sneep);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
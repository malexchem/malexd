/*const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Sneep = require('../models/sneep');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Set FFmpeg paths
ffmpeg.setFfmpegPath(path.join(__dirname, '../ffmpeg/ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(__dirname, '../ffmpeg/ffprobe.exe'));

// BunnyCDN config
const BUNNY_CONFIG = {
  storageZone: 'mizzo',
  apiKey: process.env.BUNNY_API_KEY,
  storageHost: 'jh.storage.bunnycdn.com',
  pullZone: 'mizzo.b-cdn.net',
};

// 🛠 Utilities
const createTempDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const cleanUpFiles = async (paths) => {
  for (const p of paths) {
    try {
      await unlinkAsync(p);
    } catch (err) {
      console.warn(`Failed to delete temp file: ${p}`);
    }
  }
};

const uploadToBunny = async (filePath, fileName, mimeType) => {
  const url = `https://${BUNNY_CONFIG.storageHost}/${BUNNY_CONFIG.storageZone}/${fileName}`;
  const stream = fs.createReadStream(filePath);

  await axios.put(url, stream, {
    headers: {
      AccessKey: BUNNY_CONFIG.apiKey,
      'Content-Type': mimeType,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return `https://${BUNNY_CONFIG.pullZone}/${fileName}`;
};

const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(thumbnailPath)
      .frames(1)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

// ✅ Transcode with +faststart
const transcodeVideoWithFastStart = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-movflags',
        '+faststart'
      ])
      //.outputOptions('-c:v libx264', '-preset fast', '-movflags +faststart')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
};

// 🚀 Upload Sneep Controller
exports.uploadSneep = async (req, res) => {
  const file = req.files?.['video']?.[0];
  const { title, description, tags } = req.body;
  const userId = req.user.id;

  if (!file) {
    return res.status(400).json({ error: 'No video file provided.' });
  }

  const tempDir = path.join(__dirname, '../temp');
  createTempDir(tempDir);

  const timestamp = Date.now();
  const fileExt = path.extname(file.originalname);
  const originalName = `sneep_${timestamp}${fileExt}`;
  const originalPath = path.join(tempDir, originalName);
  const transcodedName = `transcoded_${timestamp}.mp4`;
  const transcodedPath = path.join(tempDir, transcodedName);
  const thumbnailName = `thumbnail_${timestamp}.png`;
  const thumbnailPath = path.join(tempDir, thumbnailName);

  try {
    // Copy uploaded file to temp dir
    await writeFileAsync(originalPath, fs.readFileSync(file.path));

    // Transcode to faststart
    await transcodeVideoWithFastStart(originalPath, transcodedPath);

    // Use transcoded file for thumbnail + duration
    await generateThumbnail(transcodedPath, thumbnailPath);
    const duration = await getVideoDuration(transcodedPath);

    // Upload to BunnyCDN
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToBunny(transcodedPath, transcodedName, 'video/mp4'),
      uploadToBunny(thumbnailPath, thumbnailName, 'image/png'),
    ]);

    // Save to DB
    const sneep = new Sneep({
      title,
      description,
      url: videoUrl,
      thumbnailUrl,
      duration,
      user: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    await sneep.save();

    // Clean up
    await cleanUpFiles([file.path, originalPath, transcodedPath, thumbnailPath]);

    res.status(201).json(sneep);
  } catch (error) {
    console.error('Upload error:', error);
    await cleanUpFiles([file.path, originalPath, transcodedPath, thumbnailPath]);
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
};*/

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Sneep = require('../models/sneep');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // ✅ This picks the right binary
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// ✅ Set FFmpeg binary paths (cross-platform)
ffmpeg.setFfmpegPath(ffmpegPath);
// You can optionally set ffprobe if needed (ffmpeg-static usually includes it)
ffmpeg.setFfprobePath(ffmpegPath);

// BunnyCDN config
const BUNNY_CONFIG = {
  storageZone: 'mizzo',
  apiKey: process.env.BUNNY_API_KEY,
  storageHost: 'jh.storage.bunnycdn.com',
  pullZone: 'mizzo.b-cdn.net',
};

// 🛠 Utilities
const createTempDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const cleanUpFiles = async (paths) => {
  for (const p of paths) {
    try {
      await unlinkAsync(p);
    } catch (err) {
      console.warn(`Failed to delete temp file: ${p}`);
    }
  }
};

const uploadToBunny = async (filePath, fileName, mimeType) => {
  const url = `https://${BUNNY_CONFIG.storageHost}/${BUNNY_CONFIG.storageZone}/${fileName}`;
  const stream = fs.createReadStream(filePath);

  await axios.put(url, stream, {
    headers: {
      AccessKey: BUNNY_CONFIG.apiKey,
      'Content-Type': mimeType,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return `https://${BUNNY_CONFIG.pullZone}/${fileName}`;
};

const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(thumbnailPath)
      .frames(1)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const transcodeVideoWithFastStart = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-movflags',
        '+faststart'
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
};

// 🚀 Upload Sneep Controller
exports.uploadSneep = async (req, res) => {
  const file = req.files?.['video']?.[0];
  const { title, description, tags } = req.body;
  const userId = req.user.id;

  if (!file) {
    return res.status(400).json({ error: 'No video file provided.' });
  }

  const tempDir = path.join(__dirname, '../temp');
  createTempDir(tempDir);

  const timestamp = Date.now();
  const fileExt = path.extname(file.originalname);
  const originalName = `sneep_${timestamp}${fileExt}`;
  const originalPath = path.join(tempDir, originalName);
  const transcodedName = `transcoded_${timestamp}.mp4`;
  const transcodedPath = path.join(tempDir, transcodedName);
  const thumbnailName = `thumbnail_${timestamp}.png`;
  const thumbnailPath = path.join(tempDir, thumbnailName);

  try {
    // Copy uploaded file to temp dir
    await writeFileAsync(originalPath, fs.readFileSync(file.path));

    // Transcode to faststart
    await transcodeVideoWithFastStart(originalPath, transcodedPath);

    // Use transcoded file for thumbnail + duration
    await generateThumbnail(transcodedPath, thumbnailPath);
    const duration = await getVideoDuration(transcodedPath);

    // Upload to BunnyCDN
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToBunny(transcodedPath, transcodedName, 'video/mp4'),
      uploadToBunny(thumbnailPath, thumbnailName, 'image/png'),
    ]);

    // Save to DB
    const sneep = new Sneep({
      title,
      description,
      url: videoUrl,
      thumbnailUrl,
      duration,
      user: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    await sneep.save();

    // Clean up
    await cleanUpFiles([file.path, originalPath, transcodedPath, thumbnailPath]);

    res.status(201).json(sneep);
  } catch (error) {
    console.error('Upload error:', error);
    await cleanUpFiles([file.path, originalPath, transcodedPath, thumbnailPath]);
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

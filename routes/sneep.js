const express = require('express');
const multer = require('multer');
const sneepController = require('../controllers/sneepController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Protected routes
//router.post('/', authMiddleware, upload.single('video'), sneepController.uploadSneep);
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  sneepController.uploadSneep
);


// Public routes
router.get('/', sneepController.getSneeps);
router.get('/:id', sneepController.getSneep);

module.exports = router;
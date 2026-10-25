// backend/routes/upload.js
// Handles file uploads for product images and videos.
// Converts uploaded images to Base64 data URLs so they are permanently stored in MongoDB,
// eliminating the issue where Render's ephemeral disk deletes uploaded files.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Store in memory so files can be converted to Base64 Data URLs for MongoDB
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max file size
});

// POST /api/upload — upload files from admin gallery, return Base64 Data URLs for MongoDB
router.post('/', requireAuth, requireAdmin, upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  try {
    const filesData = req.files.map(file => {
      const isVideo = file.mimetype.startsWith('video/');
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return {
        url: base64Data,
        name: file.originalname,
        type: isVideo ? 'video' : 'image',
        mimetype: file.mimetype,
        size: file.size
      };
    });

    res.json({ files: filesData });
  } catch (err) {
    console.error('Upload processing error:', err);
    res.status(500).json({ message: 'Failed to process media: ' + (err.message || 'Unknown error') });
  }
}, (error, req, res, next) => {
  if (error) {
    return res.status(400).json({ message: error.message || 'File upload failed.' });
  }
  next();
});

module.exports = router;

// backend/routes/upload.js
// Handles file uploads for product images and videos.

const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', '..', 'assets', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// POST /api/upload — upload one or multiple files
router.post('/', requireAuth, requireAdmin, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  const filesData = req.files.map(file => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      url: `/assets/uploads/${file.filename}`,
      name: file.originalname,
      type: isVideo ? 'video' : 'image',
      mimetype: file.mimetype,
      size: file.size
    };
  });

  res.json({ files: filesData });
}, (error, req, res, next) => {
  if (error) {
    return res.status(400).json({ message: error.message || 'File upload failed.' });
  }
  next();
});

module.exports = router;

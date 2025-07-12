import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per request
  }
});

// @route   POST /api/uploads/images
// @desc    Upload and process images
// @access  Private
router.post('/images', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    await ensureUploadsDir();

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const processedFiles = [];

    for (const file of req.files) {
      try {
        const fileId = uuidv4();
        const fileName = `${fileId}.webp`;
        const filePath = path.join(uploadsDir, fileName);

        // Process image with sharp
        await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(filePath);

        // Generate thumbnail
        const thumbnailName = `${fileId}_thumb.webp`;
        const thumbnailPath = path.join(uploadsDir, thumbnailName);

        await sharp(file.buffer)
          .resize(300, 300, {
            fit: 'cover'
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        const fileUrl = `/uploads/${fileName}`;
        const thumbnailUrl = `/uploads/${thumbnailName}`;

        processedFiles.push({
          id: fileId,
          originalName: file.originalname,
          fileName,
          url: fileUrl,
          thumbnailUrl,
          size: (await fs.stat(filePath)).size,
          mimeType: 'image/webp'
        });

      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        // Continue with other files
      }
    }

    if (processedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process any files'
      });
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${processedFiles.length} file(s)`,
      data: { files: processedFiles }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

// @route   POST /api/uploads/avatar
// @desc    Upload and process avatar image
// @access  Private
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    await ensureUploadsDir();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileId = uuidv4();
    const fileName = `avatar_${fileId}.webp`;
    const filePath = path.join(uploadsDir, fileName);

    // Process avatar image
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover'
      })
      .webp({ quality: 90 })
      .toFile(filePath);

    const fileUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        file: {
          id: fileId,
          originalName: req.file.originalname,
          fileName,
          url: fileUrl,
          size: (await fs.stat(filePath)).size,
          mimeType: 'image/webp'
        }
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload'
    });
  }
});

// @route   DELETE /api/uploads/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(uploadsDir, filename);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);

      // Also try to delete thumbnail if it exists
      const thumbnailName = filename.replace('.webp', '_thumb.webp');
      const thumbnailPath = path.join(uploadsDir, thumbnailName);
      
      try {
        await fs.access(thumbnailPath);
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail doesn't exist, ignore
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (fileError) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }

  next(error);
});

export default router;
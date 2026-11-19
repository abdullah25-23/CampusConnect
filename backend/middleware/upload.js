const multer = require('multer');
const { fail } = require('../utils/http');

const MAX_BYTES = 5 * 1024 * 1024;
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 12, fieldSize: 10 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) return cb(Object.assign(new Error('Only PNG and JPG images are allowed'), { status: 400 }));
    cb(null, true);
  },
}).single('image');

function acceptImage(req, res, next) {
  // Compatibility: existing JSON complaint creation keeps working.
  if (!req.is('multipart/form-data')) return next();
  imageUpload(req, res, error => {
    if (error) {
      error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : (error.status || 400);
      error.message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB' : error.message;
      return next(error);
    }
    next();
  });
}

function verifyImage(file) {
  if (!file) return;
  const bytes = file.buffer;
  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if ((file.mimetype === 'image/png' && !isPng) || (file.mimetype === 'image/jpeg' && !isJpeg)) {
    fail(400, 'Invalid image file. Upload a real PNG or JPG image');
  }
}

module.exports = { acceptImage, verifyImage, MAX_BYTES };

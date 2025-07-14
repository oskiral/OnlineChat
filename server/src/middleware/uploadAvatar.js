const multer = require('multer');
const path = require('path');

// Set up multer for avatar uploads
// Configures multer to store avatar files in the 'uploads/avatars' directory with a unique filename
// This is used to update user avatars in the database
const storageAvatar = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({ storage: storageAvatar });

module.exports = uploadAvatar;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Storage Engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // save to existing server/uploads folder
    },
    filename: function (req, file, cb) {
        // Create a unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Max 5MB
    fileFilter: function (req, file, cb) {
        // Allowed ext
        const filetypes = /jpeg|jpg|png|gif|webp/;
        // Check ext
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Check mime
        const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('image') || file.mimetype === 'application/octet-stream';

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error(`Validation Failed: Invalid file type. Ext: ${path.extname(file.originalname)}, Mime: ${file.mimetype}`));
        }
    }
});

module.exports = upload;

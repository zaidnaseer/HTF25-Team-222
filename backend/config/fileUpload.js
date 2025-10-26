import multer from 'multer';
import path from 'path';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Allow PDF and text files
    if (ext === '.pdf' && file.mimetype === 'application/pdf') {
        cb(null, true);
    } else if (ext === '.txt' && file.mimetype === 'text/plain') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only .pdf and .txt files are allowed.'), false);
    }
};

// Create the multer instance
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

export default upload;
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- Cloudinary Configuration for Car Sales ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carsales_business', // Changed folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' }, // Optimize for car display
      { quality: 'auto:good' } // Auto optimize quality
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Max 10 images per car
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- MIDDLEWARE ---
// Optional: Add authentication middleware for protected routes
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === 'CAR_SALES_SECRET_KEY_2024') {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized access' 
    });
  }
};

// --- PUBLIC ROUTES ---

// @route   GET /api/cars
// @desc    Get all cars with filters
router.get('/', carController.getAllCars);

// @route   GET /api/cars/search
// @desc    Search cars with advanced filters
router.get('/search', carController.searchCars);

// @route   GET /api/cars/stats
// @desc    Get car statistics
router.get('/stats', carController.getCarStats);

// @route   GET /api/cars/:id
// @desc    Get single car by ID
router.get('/:id', carController.getCarById);

// @route   GET /api/cars/:id/similar
// @desc    Get similar cars
router.get('/:id/similar', carController.getSimilarCars);

// --- PROTECTED ROUTES (Admin Only) ---

// @route   POST /api/cars
// @desc    Create new car listing
router.post('/', authenticateAdmin, upload.array('images', 10), carController.createCar);

// @route   PUT /api/cars/:id
// @desc    Update car listing
router.put('/:id', authenticateAdmin, upload.array('images', 10), carController.updateCar);

// @route   PATCH /api/cars/:id/availability
// @desc    Update car availability
router.patch('/:id/availability', authenticateAdmin, carController.updateAvailability);

// @route   DELETE /api/cars/:id
// @desc    Delete car listing
router.delete('/:id', authenticateAdmin, carController.deleteCar);

module.exports = router;
const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

// @route   GET /api/brands
// @desc    Get all car brands
router.get('/', brandController.getAllBrands);

// @route   GET /api/brands/stats
// @desc    Get brand statistics
router.get('/stats', brandController.getBrandStats);

// @route   GET /api/brands/:id
// @desc    Get single brand with its cars
router.get('/:id', brandController.getBrand);

// @route   POST /api/brands
// @desc    Create new brand
router.post('/', brandController.createBrand);

// @route   PUT /api/brands/:id
// @desc    Update brand
router.put('/:id', brandController.updateBrand);

// @route   DELETE /api/brands/:id
// @desc    Delete brand
router.delete('/:id', brandController.deleteBrand);

// @route   POST /api/brands/seed
// @desc    Seed initial car brands
router.post('/seed', brandController.seedBrands);

module.exports = router;
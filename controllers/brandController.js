const Brand = require('../models/Brand');
const Car = require('../models/Car'); // Changed from Product to Car

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            count: brands.length,
            data: brands
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching brands',
            error: error.message
        });
    }
};

// @desc    Get single brand with its cars
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }
        
        // Get cars for this brand
        const cars = await Car.find({ brand: req.params.id })
            .select('title model year price condition mileage images')
            .limit(10);
        
        res.status(200).json({
            success: true,
            data: {
                ...brand.toObject(),
                cars: cars,
                carCount: cars.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching brand',
            error: error.message
        });
    }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private (Admin)
exports.createBrand = async (req, res) => {
    try {
        const { name, logo, country, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Brand name is required'
            });
        }
        
        // Check if brand already exists
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Brand already exists'
            });
        }
        
        const brand = await Brand.create({ 
            name, 
            logo: logo || '',
            country: country || '',
            description: description || ''
        });
        
        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            data: brand
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating brand',
            error: error.message
        });
    }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private (Admin)
exports.updateBrand = async (req, res) => {
    try {
        let brand = await Brand.findById(req.params.id);
        
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }
        
        const { name, logo, country, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Brand name is required'
            });
        }
        
        // Check if new name already exists (excluding current brand)
        const existingBrand = await Brand.findOne({ 
            name, 
            _id: { $ne: req.params.id } 
        });
        
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Brand name already exists'
            });
        }
        
        // Update brand fields
        brand.name = name;
        brand.logo = logo || brand.logo;
        brand.country = country || brand.country;
        brand.description = description || brand.description;
        
        await brand.save();
        
        res.status(200).json({
            success: true,
            message: 'Brand updated successfully',
            data: brand
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating brand',
            error: error.message
        });
    }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private (Admin)
exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }
        
        // Check if brand has associated cars
        const carCount = await Car.countDocuments({ brand: req.params.id });
        
        if (carCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete brand. It has ${carCount} associated car(s).`
            });
        }
        
        await brand.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Brand deleted successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting brand',
            error: error.message
        });
    }
};

// @desc    Seed initial car brands
// @route   POST /api/brands/seed
// @access  Private (Admin)
exports.seedBrands = async (req, res) => {
    try {
        // Clear existing brands
        await Brand.deleteMany({});

        const initialBrands = [
            { name: 'Toyota', country: 'Japan', description: 'Reliable and fuel-efficient vehicles' },
            { name: 'Honda', country: 'Japan', description: 'Known for quality and performance' },
            { name: 'Dodge', country: 'USA', description: 'American muscle cars' },
            { name: 'Ram', country: 'USA', description: 'Trucks and commercial vehicles' },
            { name: 'Hyundai', country: 'South Korea', description: 'Modern and affordable cars' },
            { name: 'Ford', country: 'USA', description: 'American automotive manufacturer' },
            { name: 'Mercedes-Benz', country: 'Germany', description: 'Luxury vehicles' },
            { name: 'Subaru', country: 'Japan', description: 'All-wheel drive specialists' },
            { name: 'Nissan', country: 'Japan', description: 'Innovative Japanese automaker' },
            { name: 'Lexus', country: 'Japan', description: 'Toyota luxury division' },
            { name: 'Volkswagen', country: 'Germany', description: 'German automotive brand' }
        ];

        await Brand.insertMany(initialBrands);

        res.status(200).json({ 
            success: true, 
            message: 'Car brands seeded successfully!',
            count: initialBrands.length
        });
    } catch (error) {
        console.error("Error seeding brands:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error seeding brands',
            error: error.message 
        });
    }
};

// @desc    Get brand statistics
// @route   GET /api/brands/stats
// @access  Public
exports.getBrandStats = async (req, res) => {
    try {
        const stats = await Car.aggregate([
            {
                $group: {
                    _id: '$brand',
                    carCount: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    avgMileage: { $avg: '$mileage' },
                    minYear: { $min: '$year' },
                    maxYear: { $max: '$year' }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $unwind: '$brandInfo'
            },
            {
                $project: {
                    brandName: '$brandInfo.name',
                    carCount: 1,
                    avgPrice: { $round: ['$avgPrice', 2] },
                    avgMileage: { $round: ['$avgMileage', 0] },
                    yearRange: { 
                        min: '$minYear',
                        max: '$maxYear'
                    }
                }
            },
            {
                $sort: { carCount: -1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching brand statistics',
            error: error.message
        });
    }
};
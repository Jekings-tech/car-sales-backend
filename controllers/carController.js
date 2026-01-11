const Car = require('../models/Car');
const Brand = require('../models/Brand');

// @desc    Get all cars with filters and pagination
// @route   GET /api/cars
// @access  Public
exports.getAllCars = async (req, res) => {
    try {
        const { 
            brand, 
            minPrice, 
            maxPrice, 
            minYear, 
            maxYear, 
            condition, 
            transmission, 
            fuelType,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Build filter object
        let filter = {};
        
        if (brand) filter.brand = brand;
        if (condition) filter.condition = condition;
        if (transmission) filter.transmission = transmission;
        if (fuelType) filter.fuelType = fuelType;
        
        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        
        // Year range filter
        if (minYear || maxYear) {
            filter.year = {};
            if (minYear) filter.year.$gte = parseInt(minYear);
            if (maxYear) filter.year.$lte = parseInt(maxYear);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Determine sort order
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortDirection };

        const cars = await Car.find(filter)
            .populate('brand', 'name logo country')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCars = await Car.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: cars.length,
            total: totalCars,
            totalPages: Math.ceil(totalCars / limit),
            currentPage: parseInt(page),
            data: cars
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching cars', 
            error: error.message 
        });
    }
};

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id)
            .populate('brand', 'name logo country description');
        
        if (!car) {
            return res.status(404).json({ 
                success: false, 
                message: 'Car not found' 
            });
        }
        
        // Increment view count or similar analytics could go here
        res.status(200).json({ 
            success: true, 
            data: car 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching car', 
            error: error.message 
        });
    }
};

// @desc    Create new car listing
// @route   POST /api/cars
// @access  Private (Admin)
exports.createCar = async (req, res) => {
    try {
        const { 
            title, 
            brand, 
            model, 
            year, 
            price, 
            condition, 
            mileage, 
            transmission, 
            fuelType, 
            color, 
            vin, 
            description, 
            features,
            location 
        } = req.body;

        // Basic validation
        const requiredFields = ['title', 'brand', 'model', 'year', 'price', 'condition', 
                               'mileage', 'transmission', 'fuelType', 'color', 'description'];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Field "${field}" is required` 
                });
            }
        }

        // Map Cloudinary URLs from req.files
        const images = req.files ? req.files.map(file => file.path) : [];
        
        if (images.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one image is required' 
            });
        }

        // Parse features array if it's a string
        let featuresArray = [];
        if (features) {
            featuresArray = Array.isArray(features) ? features : features.split(',');
        }

        const car = await Car.create({
            title,
            brand,
            model,
            year: parseInt(year),
            price: parseFloat(price),
            condition,
            mileage: parseInt(mileage),
            transmission,
            fuelType,
            color,
            vin: vin || null,
            description,
            images,
            features: featuresArray,
            location: location || 'Showroom',
            isAvailable: true
        });

        const populatedCar = await Car.findById(car._id)
            .populate('brand', 'name logo');

        res.status(201).json({ 
            success: true, 
            message: 'Car listing created successfully', 
            data: populatedCar 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error creating car listing', 
            error: error.message 
        });
    }
};

// @desc    Update car listing
// @route   PUT /api/cars/:id
// @access  Private (Admin)
exports.updateCar = async (req, res) => {
    try {
        let car = await Car.findById(req.params.id);
        
        if (!car) {
            return res.status(404).json({ 
                success: false, 
                message: 'Car not found' 
            });
        }

        // Update basic fields
        const updatableFields = ['title', 'brand', 'model', 'year', 'price', 'condition', 
                                'mileage', 'transmission', 'fuelType', 'color', 'vin', 
                                'description', 'features', 'location', 'isAvailable'];
        
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'year' || field === 'mileage') {
                    car[field] = parseInt(req.body[field]);
                } else if (field === 'price') {
                    car[field] = parseFloat(req.body[field]);
                } else if (field === 'features' && typeof req.body[field] === 'string') {
                    car[field] = req.body[field].split(',');
                } else {
                    car[field] = req.body[field];
                }
            }
        });

        // If new images were uploaded to Cloudinary
        if (req.files && req.files.length > 0) {
            // Replace the old image array with the new Cloudinary URLs
            car.images = req.files.map(file => file.path);
        }
        
        await car.save();
        
        const updatedCar = await Car.findById(car._id)
            .populate('brand', 'name logo');

        res.status(200).json({ 
            success: true, 
            message: 'Car updated successfully', 
            data: updatedCar 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating car', 
            error: error.message 
        });
    }
};

// @desc    Delete car listing
// @route   DELETE /api/cars/:id
// @access  Private (Admin)
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ 
                success: false, 
                message: 'Car not found' 
            });
        }

        // Note: For production, you might want to delete images from Cloudinary too
        await car.deleteOne();
        
        res.status(200).json({ 
            success: true, 
            message: 'Car listing deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting car', 
            error: error.message 
        });
    }
};

// @desc    Search cars with advanced filters
// @route   GET /api/cars/search
// @access  Public
exports.searchCars = async (req, res) => {
    try {
        const { 
            search, 
            minPrice, 
            maxPrice, 
            minYear, 
            maxYear,
            minMileage,
            maxMileage,
            brand,
            condition,
            transmission,
            fuelType 
        } = req.query;
        
        let query = {};

        // Text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { color: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by brand
        if (brand) {
            if (Array.isArray(brand)) {
                query.brand = { $in: brand };
            } else {
                query.brand = brand;
            }
        }

        // Other filters
        if (condition) query.condition = condition;
        if (transmission) query.transmission = transmission;
        if (fuelType) query.fuelType = fuelType;

        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Year range
        if (minYear || maxYear) {
            query.year = {};
            if (minYear) query.year.$gte = parseInt(minYear);
            if (maxYear) query.year.$lte = parseInt(maxYear);
        }

        // Mileage range
        if (minMileage || maxMileage) {
            query.mileage = {};
            if (minMileage) query.mileage.$gte = parseInt(minMileage);
            if (maxMileage) query.mileage.$lte = parseInt(maxMileage);
        }

        const cars = await Car.find(query)
            .populate('brand', 'name logo')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            count: cars.length, 
            data: cars 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Search failed', 
            error: error.message 
        });
    }
};

// @desc    Get car statistics
// @route   GET /api/cars/stats
// @access  Public
exports.getCarStats = async (req, res) => {
    try {
        const stats = await Car.aggregate([
            {
                $group: {
                    _id: null,
                    totalCars: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    avgMileage: { $avg: '$mileage' },
                    avgYear: { $avg: '$year' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    minYear: { $min: '$year' },
                    maxYear: { $max: '$year' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCars: 1,
                    avgPrice: { $round: ['$avgPrice', 2] },
                    avgMileage: { $round: ['$avgMileage', 0] },
                    avgYear: { $round: ['$avgYear', 0] },
                    priceRange: {
                        min: '$minPrice',
                        max: '$maxPrice'
                    },
                    yearRange: {
                        min: '$minYear',
                        max: '$maxYear'
                    }
                }
            }
        ]);

        // Get counts by condition
        const conditionStats = await Car.aggregate([
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get counts by transmission
        const transmissionStats = await Car.aggregate([
            {
                $group: {
                    _id: '$transmission',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overall: stats[0] || {},
                byCondition: conditionStats,
                byTransmission: transmissionStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching car statistics',
            error: error.message
        });
    }
};

// @desc    Get similar cars
// @route   GET /api/cars/:id/similar
// @access  Public
exports.getSimilarCars = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        const similarCars = await Car.find({
            _id: { $ne: car._id },
            $or: [
                { brand: car.brand },
                { condition: car.condition },
                { price: { $gte: car.price * 0.8, $lte: car.price * 1.2 } }
            ]
        })
        .populate('brand', 'name logo')
        .limit(6)
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: similarCars.length,
            data: similarCars
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching similar cars',
            error: error.message
        });
    }
};

// @desc    Update car availability
// @route   PATCH /api/cars/:id/availability
// @access  Private (Admin)
exports.updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        car.isAvailable = isAvailable !== undefined ? isAvailable : car.isAvailable;
        await car.save();

        res.status(200).json({
            success: true,
            message: `Car marked as ${car.isAvailable ? 'available' : 'sold'}`,
            data: car
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating car availability',
            error: error.message
        });
    }
};
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    title: {  // Changed from 'name' to 'title' for better semantics
        type: String,
        required: [true, 'Car title is required'],
        trim: true
    },
    brand: {  // Changed from 'category' to 'brand' for clarity
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',  // Changed reference to 'Brand'
        required: [true, 'Brand is required']
    },
    model: {  // NEW: Specific car model
        type: String,
        required: [true, 'Car model is required'],
        trim: true
    },
    year: {  // NEW: Manufacturing year
        type: Number,
        required: [true, 'Manufacturing year is required'],
        min: [1900, 'Year must be after 1900'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    condition: {
        type: String,
        enum: ['New', 'Used', 'Certified Pre-Owned'],  // Updated options
        default: 'Used'
    },
    mileage: {  // NEW: Odometer reading
        type: Number,
        required: [true, 'Mileage is required'],
        min: [0, 'Mileage cannot be negative']
    },
    transmission: {  // NEW: Transmission type
        type: String,
        enum: ['Automatic', 'Manual', 'Semi-Automatic', 'CVT'],
        required: [true, 'Transmission type is required']
    },
    fuelType: {  // NEW: Fuel type
        type: String,
        enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'],
        required: [true, 'Fuel type is required']
    },
    color: {  // NEW: Car color
        type: String,
        required: [true, 'Color is required'],
        trim: true
    },
    vin: {  // NEW: Vehicle Identification Number
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values while maintaining uniqueness
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    images: {
        type: [String],  // Cloudinary URLs
        default: [],
        validate: {
            validator: function(array) {
                return array.length <= 10; // Limit to 10 images
            },
            message: 'Cannot upload more than 10 images'
        }
    },
    features: {  // NEW: Additional features/options
        type: [String],
        default: []
    },
    location: {  // NEW: Where the car is located
        type: String,
        trim: true,
        default: 'Showroom'
    },
    isAvailable: {  // NEW: Availability status
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true
});

// Index for better search performance
carSchema.index({ title: 'text', description: 'text', model: 'text' });
carSchema.index({ brand: 1, price: 1, year: -1 });

module.exports = mongoose.model('Car', carSchema);
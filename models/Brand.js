const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Brand name is required'],
        unique: true,
        trim: true
    },
    logo: {  // NEW: Brand logo image URL
        type: String,
        default: ''
    },
    country: {  // NEW: Country of origin
        type: String,
        trim: true,
        default: ''
    },
    description: {  // NEW: Brief brand description
        type: String,
        trim: true,
        default: ''
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Brand', brandSchema);
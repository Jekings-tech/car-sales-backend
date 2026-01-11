require('dotenv').config(); // 👈 Loads environment variables (MongoDB, Cloudinary, etc.)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads (if needed locally)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==============================================
// DATABASE CONNECTION - USING .ENV FILE
// ==============================================

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://menangjekings_db_user:CarSalesDB2026@cluster0.sa879zu.mongodb.net/CarSalesDB?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
.then(() => {
    console.log('✅ MongoDB Atlas connected successfully to CarSalesDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure:');
    console.log('   1. Your .env file has MONGODB_URI');
    console.log('   2. IP is whitelisted in MongoDB Atlas (0.0.0.0/0)');
    console.log('   3. Database user exists and password is correct');
});

// ==============================================
// ROUTE IMPORTS (NOTE: You need to rename these files!)
// ==============================================

// IMPORTANT: Rename these files or update the imports:
// productRoutes.js → carRoutes.js
// categoryRoutes.js → brandRoutes.js
const carRoutes = require('./routes/carRoutes');      // Previously productRoutes
const brandRoutes = require('./routes/brandRoutes');  // Previously categoryRoutes

// ==============================================
// AUTHENTICATION ROUTE
// ==============================================

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Updated credentials for car sales admin
    if (username === 'CarSalesAdmin' && password === 'CarSalesAdmin237') {
        res.json({ 
            success: true, 
            token: 'CAR_SALES_SECRET_KEY_2024', // Updated token
            message: 'Welcome to Car Sales Admin Dashboard'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// ==============================================
// API ROUTES
// ==============================================

app.use('/api/cars', carRoutes);    // Changed from /api/products
app.use('/api/brands', brandRoutes); // Changed from /api/categories

// ==============================================
// HEALTH CHECK ROUTE (For testing)
// ==============================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        message: 'Car Sales API is running'
    });
});

// ==============================================
// START SERVER
// ==============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚗 Car Sales Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
});
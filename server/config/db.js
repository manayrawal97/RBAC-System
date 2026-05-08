const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Called once when server starts
 */

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`❌ MongoDB Error: ${error.message}`);
        process.exit(1); // Stop the server if DB fails
        // process.exit(1): means "if the database fails to connect, shut the whole server down" — you don't want a server running with no database.
    }   
};

module.exports = connectDB;
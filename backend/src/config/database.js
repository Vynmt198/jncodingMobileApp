const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('[DB] MONGODB_URI not set. Running without database.');
            return;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DB] Connection error: ${error.message}`);
        console.warn('[DB] Continuing without database connection...');
    }
};
mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
});

module.exports = connectDB;

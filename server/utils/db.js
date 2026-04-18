const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: MONGO_URI is not defined in environment variables!');
        console.error('The server will likely crash when attempting to connect to localhost on Vercel.');
    }

    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/research_portal';
        console.log(`Connecting to MongoDB...`);
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Database Connection Error: ${err.message}`);
        // If we are in local development, we exit. If on Vercel, we let the crash happen 
        // to show logs, but we've logged a better message.
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;


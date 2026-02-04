const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Submission = require('./models/Submission');
require('dotenv').config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research_portal');
        console.log('MongoDB Connected');

        await User.deleteMany({});
        await Submission.deleteMany({});

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const admin = new User({
            name: 'System Admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin'
        });

        const studentPassword = await bcrypt.hash('student123', salt);
        const student = new User({
            name: 'John Doe',
            email: 'student@example.com',
            password: studentPassword,
            role: 'student'
        });

        await admin.save();
        await student.save();

        console.log('Database Seeded!');
        console.log('Admin: admin@example.com / admin123');
        console.log('Student: student@example.com / student123');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();

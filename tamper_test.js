const mongoose = require('mongoose');
require('dotenv').config();
const Submission = require('./server/models/Submission');

async function tamper() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research_portal');
    console.log('Connected to DB');

    const sub = await Submission.findOne();
    if (sub) {
        console.log(`Tampering with submission: ${sub.title}`);
        sub.fileHash = 'tampered_hash_1234567890abcdef';
        await sub.save();
        console.log('Tamper complete. Dashboard should now show 1 alert.');
    } else {
        console.log('No submissions found to tamper with.');
    }

    await mongoose.disconnect();
}

tamper();

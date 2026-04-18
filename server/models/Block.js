const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    index: {
        type: Number,
        required: true,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    data: {
        submissionId: String,
        studentId: String,
        studentName: String,
        title: String,
        fileHash: String
    },
    previousHash: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    nonce: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Block', BlockSchema);

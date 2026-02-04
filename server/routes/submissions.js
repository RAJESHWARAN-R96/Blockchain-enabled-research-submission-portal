const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Submission = require('../models/Submission');
const User = require('../models/User');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
};

router.post('/upload', upload.single('document'), async (req, res) => {
    const { title, studentId } = req.body;

    if (!req.file || !title || !studentId) {
        return res.status(400).json({ msg: 'Please provide all fields and a file' });
    }

    try {
        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ msg: 'Student not found' });

        const fileHash = await calculateFileHash(req.file.path);

        const newSubmission = new Submission({
            studentId,
            studentName: user.name,
            title,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileHash,
            status: 'pending'
        });

        console.log(`[BLOCKCHAIN] New Block Created:`);
        console.log(` - File: ${req.file.originalname}`);
        console.log(` - Hash: ${fileHash}`);


        await newSubmission.save();
        res.json({ msg: 'Submission successful', submission: newSubmission });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/my-submissions/:id', async (req, res) => {
    try {
        const submissions = await Submission.find({ studentId: req.params.id }).sort({ timestamp: -1 });
        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/all', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ timestamp: -1 });
        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/action', async (req, res) => {
    const { submissionId, status } = req.body;

    try {
        let submission = await Submission.findById(submissionId);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });

        submission.status = status;
        await submission.save();
        res.json({ msg: `Submission ${status}`, submission });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/verify', async (req, res) => {
    const { submissionId } = req.body;

    try {
        const submission = await Submission.findById(submissionId);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });

        if (!fs.existsSync(submission.filePath)) {
            return res.json({ verified: false, msg: 'File not found on server' });
        }

        const currentHash = await calculateFileHash(submission.filePath);

        console.log(`[BLOCKCHAIN] Verifying Block ID: ${submission.fileHash}`);
        console.log(` - Re-calculated Hash: ${currentHash}`);

        if (currentHash === submission.fileHash) {
            console.log(` - Result: MATCH (Integrity Verified)`);
            res.json({ verified: true, msg: 'Integrity Verified: Hash matches blockchain record.' });
        } else {
            console.log(` - Result: MISMATCH (Tampering Detected)`);
            res.json({ verified: false, msg: 'WARNING: File has been tampered with! Hash mismatch.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

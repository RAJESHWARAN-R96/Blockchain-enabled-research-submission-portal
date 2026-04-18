const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Submission = require('../models/Submission');
const User = require('../models/User');
const blockchain = require('../utils/blockchain'); // Added Blockchain Utility
const Block = require('../models/Block'); // Added Block Model

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

        const savedSubmission = await newSubmission.save();

        // [BLOCKCHAIN] Record transaction in the blockchain
        console.log(`[BLOCKCHAIN] Logging Submission ${savedSubmission._id} to the chain...`);
        await blockchain.addBlock({
            submissionId: savedSubmission._id,
            studentId,
            studentName: user.name,
            title,
            fileHash
        });

        res.json({ msg: 'Submission successful and logged to Blockchain', submission: savedSubmission });

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
        console.log(`[STATUS UPDATE] Submission ${submissionId} marked as ${status}`);
        res.json({ msg: `Submission ${status}`, submission });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/stats', async (req, res) => {
    try {
        const total = await Submission.countDocuments();
        const pending = await Submission.countDocuments({ status: 'pending' });
        const approved = await Submission.countDocuments({ status: 'approved' });
        const rejected = await Submission.countDocuments({ status: 'rejected' });

        // Deep Security Audit: Cross-check EACH submission against Blockchain
        const allSubmissions = await Submission.find();
        let tamperedCount = 0;
        
        for (const sub of allSubmissions) {
            const block = await Block.findOne({ "data.submissionId": sub._id.toString() });
            if (block) {
                // If sub.fileHash in DB doesn't match the immutable record in the Block
                if (sub.fileHash !== block.data.fileHash) {
                    tamperedCount++;
                }
            } else {
                // If a submission exists but has NO blockchain record, it's potentially unauthorized
                tamperedCount++;
            }
        }

        // 6-Month Rolling Statistical Audit
        const monthlyStats = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const [totalM, approvedM, rejectedM] = await Promise.all([
                Submission.countDocuments({ timestamp: { $gte: startOfMonth, $lte: endOfMonth } }),
                Submission.countDocuments({ status: 'approved', timestamp: { $gte: startOfMonth, $lte: endOfMonth } }),
                Submission.countDocuments({ status: 'rejected', timestamp: { $gte: startOfMonth, $lte: endOfMonth } })
            ]);

            monthlyStats.push({
                month: monthLabel,
                total: totalM,
                approved: approvedM,
                rejected: rejectedM
            });
        }

        // Structural integrity check
        let isChainValid = await blockchain.isChainValid();
        
        // If data tampering detected, the 'Health' of the system is compromised
        if (tamperedCount > 0) isChainValid = false;
        
        res.json({
            total,
            pending,
            approved,
            rejected,
            tampered: tamperedCount,
            isChainValid,
            monthlyStats
        });
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

        // 1. Audit Entire Blockchain Integrity
        console.log(`[BLOCKCHAIN] Auditing Chain Integrity...`);
        const isChainValid = await blockchain.isChainValid();
        if (!isChainValid) {
            return res.status(500).json({ 
                verified: false, 
                msg: 'CRITICAL ERROR: Blockchain has been tampered with or corrupted!' 
            });
        }

        // 2. Find specific block for this submission
        const block = await Block.findOne({ "data.submissionId": submissionId });
        if (!block) {
            return res.status(404).json({ 
                verified: false, 
                msg: 'Error: This submission was not recorded on the blockchain.' 
            });
        }

        if (!fs.existsSync(submission.filePath)) {
            return res.json({ verified: false, msg: 'File not found on server' });
        }

        // 3. Re-calculate current file hash
        const currentHash = await calculateFileHash(submission.filePath);

        console.log(`[BLOCKCHAIN] Verifying Submission Record...`);
        console.log(` - File Hash on Disk: ${currentHash}`);
        console.log(` - Block Hash Record: ${block.data.fileHash}`);

        // Compare current file against the BLOCKCHAIN record (not just the DB record)
        if (currentHash === block.data.fileHash) {
            console.log(` - Result: MATCH (Integrity Verified via Blockchain)`);
            res.json({ 
                verified: true, 
                msg: 'Integrity Verified: File and Blockchain records match perfectly.',
                blockchain_info: {
                    blockIndex: block.index,
                    prevHash: block.previousHash,
                    currentHash: block.hash
                }
            });
        } else {
            console.log(` - Result: MISMATCH (Tampering Detected)`);
            res.json({ 
                verified: false, 
                msg: 'WARNING: File content has been tampered with! Does not match Blockchain record.' 
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

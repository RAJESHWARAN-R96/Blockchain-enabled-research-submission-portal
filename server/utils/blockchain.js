const crypto = require('crypto');
const Block = require('../models/Block');

class Blockchain {
    constructor() {
        this.difficulty = 2; // Simple difficulty for demonstration
    }

    // Generate a hash based on block contents
    calculateHash(index, timestamp, data, previousHash, nonce) {
        // Ensure data fields are in a predictable order
        const dataStr = JSON.stringify({
            submissionId: data.submissionId ? data.submissionId.toString() : "",
            studentId: data.studentId ? data.studentId.toString() : "",
            studentName: data.studentName || "",
            title: data.title || "",
            fileHash: data.fileHash || ""
        });

        const str = index.toString() + 
                    new Date(timestamp).getTime().toString() + 
                    dataStr + 
                    previousHash + 
                    nonce.toString();
        
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    // Get the latest block from the database
    async getLatestBlock() {
        return await Block.findOne().sort({ index: -1 });
    }

    // Initialize the genesis block if the chain is empty
    async createGenesisBlock() {
        const existingBlocks = await Block.countDocuments();
        if (existingBlocks === 0) {
            const genesisData = { message: "Genesis Block - Portal Launched" };
            const timestamp = new Date();
            // Custom hash calc for genesis since data structure is different
            const str = "0" + timestamp.getTime().toString() + JSON.stringify(genesisData) + "0" + "0";
            const hash = crypto.createHash('sha256').update(str).digest('hex');
            
            const genesisBlock = new Block({
                index: 0,
                timestamp,
                data: genesisData,
                previousHash: "0",
                hash
            });
            await genesisBlock.save();
            console.log("[BLOCKCHAIN] Genesis Block Created.");
        }
    }

    // Add a new block to the chain (Mining)
    async addBlock(data) {
        // Ensure genesis block exists
        await this.createGenesisBlock();
        
        const latestBlock = await this.getLatestBlock();
        const index = latestBlock.index + 1;
        const timestamp = new Date();
        const previousHash = latestBlock.hash;
        
        let nonce = 0;
        let hash = this.calculateHash(index, timestamp, data, previousHash, nonce);

        // Simple Proof of Work (Mines the block)
        console.log(`[BLOCKCHAIN] Mining Block ${index}...`);
        while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
            nonce++;
            hash = this.calculateHash(index, timestamp, data, previousHash, nonce);
        }
        console.log(`[BLOCKCHAIN] Block Mined: ${hash}`);

        const newBlock = new Block({
            index,
            timestamp,
            data,
            previousHash,
            hash,
            nonce
        });

        return await newBlock.save();
    }

    // Validate the entire chain's integrity
    async isChainValid() {
        const blocks = await Block.find().sort({ index: 1 });

        for (let i = 1; i < blocks.length; i++) {
            const currentBlock = blocks[i];
            const previousBlock = blocks[i - 1];

            // 1. Re-calculate hash and compare
            const recalculatedHash = this.calculateHash(
                currentBlock.index,
                currentBlock.timestamp,
                currentBlock.data,
                currentBlock.previousHash,
                currentBlock.nonce
            );

            if (currentBlock.hash !== recalculatedHash) {
                console.error(`[BLOCKCHAIN] Hash mismatch at block ${currentBlock.index}`);
                return false;
            }

            // 2. Link check (previousHash)
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`[BLOCKCHAIN] Link broken at block ${currentBlock.index}`);
                return false;
            }
        }
        return true;
    }
}

module.exports = new Blockchain();

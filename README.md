# Blockchain-Enabled Research Submission Portal

A full-stack web application for secure research paper submissions, featuring a blockchain-simulated integrity verification system using SHA256 hashing.

## Features
- **Student Portal**: Register, login, upload PDF research papers.
- **Admin Portal**: View all submissions, approve/reject, and **verify file integrity**.
- **Blockchain Simulation**: Every uploaded file is hashed. The hash is stored as a "Block ID". Admins can re-calculate the hash of the stored file to verify it hasn't been tampered with.

## Tech Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Security**: SHA256 Hashing, Bcrypt (Passwords)

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### Installation
1.  Open this folder in your terminal.
2.  Install dependencies:
    ```bash
    npm install
    ```
    *(Note: If you see errors, try `npm install express mongoose multer bcryptjs cors dotenv body-parser`)*

### Database Setup (Optional)
To populate the database with a test Admin and Student account:
```bash
node server/seed.js
```
- **Admin**: `admin@example.com` / `admin123`
- **Student**: `student@example.com` / `student123`

### Running the App
1.  Start the server:
    ```bash
    npm start
    ```
    or for development:
    ```bash
    npm run dev
    ```
2.  Open your browser to: [http://localhost:5000](http://localhost:5000)

## Project Structure
- `public/`: Frontend files (HTML, CSS, JS)
- `server/`: Backend logic
    - `models/`: Database schemas
    - `routes/`: API endpoints
    - `utils/`: DB connection
- `uploads/`: Storage for uploaded PDF files

## Key Concept: integrity Verification
When a student uploads a file, we calculate its SHA256 hash and store it in the database.
Later, an admin can click "Verify". The server reads the file from disk *again*, calculates the hash *again*, and compares it to the stored hash. If they match, the file is authentic. If a hacker modified the file on the server, the hashes would not match.

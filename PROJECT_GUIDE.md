# Project Guide: Blockchain-Enabled Research Submission Portal

Welcome to your **Blockchain-Enabled Research Submission Portal**. This guide provides a full explanation of the system's architecture, technologies, and core integrity features.

---

## 🚀 1. Project Overview
This platform is designed to combat academic fraud by using **cryptographic hashing** and a **simulated blockchain ledger**. Every research paper uploaded by a student is assigned a unique digital fingerprint, making it mathematically impossible to alter the document without detection.

---

## 🛠️ 2. The Technical Stack
The project is built using the **MERN (subset)** stack for high performance and scalability:
-   **Frontend**: Vanilla HTML5, JavaScript (ES6+), and Bootstrap 5 for a "Cyber-Secure" professional design.
-   **Backend**: Node.js and Express.js for handling authentication and file processing.
-   **Database**: MongoDB (via Mongoose) to store student profiles, submission metadata, and the blockchain ledger.
-   **Visualizations**: Chart.js for real-time submission statistics and security monitoring.

---

## 🛡️ 3. Core Security Features

### A. SHA-256 Content Hashing
When a file is uploaded, the server calculates its **SHA-256 fingerprint**.
-   **Integrity**: If even one character in the file is changed, the hash will completely break.
-   **Persistence**: This hash is stored permanently on the disk and in the database.

### B. Internal Blockchain Ledger
Every submission is "mined" into a private block.
-   **Immutable Chain**: Each block contains the `Previous Block's Hash`.
-   **Proof of Work**: We use a difficulty-based mining system to ensure data cannot be retroactively edited.
-   **Double-Layer Audit**: The Admin Dashboard cross-references the file you see in the table against the original record in the blockchain.

---

## 📊 4. Admin Dashboard Functionality
The dashboard provides a high-level command center for administrators:
1.  **Analytics Suite**: Real-time Monthly Upload Trends (Bar Charts) and status breakdowns (Doughnut Charts).
-   **Security Portal**: Shows a live **'Tampered Records'** count and a **'Blockchain Health'** indicator.
-   **Approval Workflow**: Admins can approve or reject papers, which is instantly reflected in the student's dashboard.

---

## 🔄 5. Key Workflows

### Student Workflow:
1.  **Registration**: Sign up as a "Student".
2.  **Upload**: Provide a title and select a research PDF.
3.  **Verification**: After upload, see the **Blockchain ID (Hash)** assigned to your paper.

### Admin Workflow:
1.  **Review**: See all pending research submissions.
2.  **Verify**: Click **'Verify Hash'** to perform a real-time integrity check with the blockchain.
3.  **Monitor**: Keep an eye on the **'Security Alerts'** (Danger Signal) card to ensure no data mismatches exist in the system.

---

## 📁 6. Folder Structure
-   `/public`: Standard UI (HTML/CSS/JS).
-   `/server/app.js`: Main server entry point.
-   `/server/routes`: API endpoints for Auth and Submissions.
-   `/server/models`: Database schemas (User, Submission, Block).
-   `/server/utils`: Core Blockchain logic and Database connection.
-   `/uploads`: Secure storage for uploaded research papers.

---

*This project is a state-of-the-art demonstration of how blockchain can bring 100% trust and transparency to academic research.*

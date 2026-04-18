// Check if user is logged in
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

// Check if user is admin, if not redirect to student dashboard
function checkAdmin() {
    const user = checkAuth();
    if (user.role !== 'admin') {
        window.location.href = 'student_dashboard.html';
    }
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Dynamic API URL: Automatically switches between local and production
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';


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

const API_URL = 'http://localhost:5000/api';

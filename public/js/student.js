document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user.role !== 'student') {
        window.location.href = 'admin_dashboard.html';
    }
    loadSubmissions();
});

// Handle Upload
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = checkAuth();
    const title = document.getElementById('title').value;
    const file = document.getElementById('file').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('studentId', user.id);
    formData.append('document', file);

    try {
        const res = await fetch(`${API_URL}/submissions/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (res.ok) {
            alert('File uploaded and hashed successfully!');
            document.getElementById('uploadForm').reset();
            loadSubmissions();
        } else {
            alert(data.msg);
        }
    } catch (err) {
        console.error(err);
        alert('Upload failed');
    }
});

// Load Submissions
async function loadSubmissions() {
    const user = checkAuth();
    try {
        const res = await fetch(`${API_URL}/submissions/my-submissions/${user.id}`);
        const submissions = await res.json();

        const tbody = document.getElementById('submissionsTable');
        tbody.innerHTML = '';

        submissions.forEach(sub => {
            const row = `
                <tr>
                    <td>${sub.title}</td>
                    <td class="mono" title="${sub.fileHash}">${sub.fileHash.substring(0, 10)}...</td>
                    <td><span class="status-${sub.status}">${sub.status}</span></td>
                    <td>${new Date(sub.timestamp).toLocaleDateString()}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    loadAllSubmissions();
});

async function loadAllSubmissions() {
    try {
        const res = await fetch(`${API_URL}/submissions/all`);
        const submissions = await res.json();

        const tbody = document.getElementById('adminTable');
        tbody.innerHTML = '';

        submissions.forEach(sub => {
            const row = `
                <tr>
                    <td>${sub.studentName}</td>
                    <td>${sub.title}</td>
                    <td><a href="/uploads/${pathHelper(sub.filePath)}" target="_blank">View PDF</a></td>
                    <td class="mono" title="${sub.fileHash}">${sub.fileHash.substring(0, 8)}...</td>
                    <td><span class="status-${sub.status}">${sub.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info text-white" onclick="verifyIntegrity('${sub._id}')">Verify Hash</button>
                        ${sub.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateStatus('${sub._id}', 'approved')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="updateStatus('${sub._id}', 'rejected')">Reject</button>
                        ` : ''}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error(err);
    }
}

// Helper to make path relative for href
function pathHelper(fullPath) {
    // Assuming uploads are served at /uploads and filePath is absolute or relative from root
    // Our backend stored absolute path or relative? 
    // In submissions.js: filePath: req.file.path. 
    // If windows, path might be full path. 
    // Let's just use the filename since we serve /uploads/ statically
    // But req.file.path from multer might be c:\...\uploads\filename
    const filename = fullPath.split(/[\\/]/).pop();
    return filename;
}

async function updateStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;

    try {
        const res = await fetch(`${API_URL}/submissions/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId: id, status })
        });
        const data = await res.json();
        if (res.ok) {
            loadAllSubmissions();
        } else {
            alert(data.msg);
        }
    } catch (err) {
        console.error(err);
    }
}

async function verifyIntegrity(id) {
    try {
        const res = await fetch(`${API_URL}/submissions/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId: id })
        });
        const data = await res.json();

        const modalEl = new bootstrap.Modal(document.getElementById('verifyModal'));
        const resultDiv = document.getElementById('verifyResult');

        if (data.verified) {
            resultDiv.className = 'alert alert-success';
            resultDiv.innerHTML = `✅ ${data.msg}`;
        } else {
            resultDiv.className = 'alert alert-danger';
            resultDiv.innerHTML = `❌ ${data.msg}`;
        }

        modalEl.show();
    } catch (err) {
        console.error(err);
        alert('Verification request failed');
    }
}

let trendChart = null;
let statusChart = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    loadAllSubmissions();
    loadDashboardStats();

    // Attach event listeners via delegation ONCE
    const tbody = document.getElementById('adminTable');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            const verifyBtn = e.target.closest('.verify-btn');
            
            if (actionBtn) {
                const id = actionBtn.getAttribute('data-id');
                const action = actionBtn.getAttribute('data-action');
                updateStatus(id, action);
            } else if (verifyBtn) {
                const id = verifyBtn.getAttribute('data-id');
                verifyIntegrity(id);
            }
        });
    }
});

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/submissions/stats`);
        const stats = await res.json();

        // Update Stats Cards
        document.getElementById('stat-total').innerText = stats.total;
        document.getElementById('stat-approved').innerText = stats.approved;
        document.getElementById('stat-pending').innerText = stats.pending;
        document.getElementById('stat-tampered').innerText = stats.tampered;

        // Dynamic Card Color for Alerts (Option 2: Danger Signal)
        const tamperCard = document.getElementById('tamperCard');
        const tamperText = document.getElementById('stat-tampered');
        const alertIcon = document.getElementById('alertIcon');

        if (stats.tampered > 0) {
            tamperCard.className = 'card stat-card text-center p-3 shadow-sm border-0 stat-card-danger';
            tamperText.className = 'text-white mb-0 blink';
            alertIcon.classList.remove('d-none');
        } else {
            tamperCard.className = 'card stat-card text-center p-3 shadow-sm border bg-red text-white';
            tamperText.className = 'text-white mb-0';
            alertIcon.classList.add('d-none');
        }

        // Update Health Badge
        const healthScore = document.getElementById('healthScore');
        const healthBadge = document.getElementById('healthBadge');
        if (stats.isChainValid) {
            healthScore.innerText = '100% SECURE';
            healthScore.className = 'text-success fw-bold';
            healthBadge.className = 'badge rounded-pill bg-light text-dark border p-2 px-3 shadow-xs';
        } else {
            healthScore.innerText = 'TAMPERED';
            healthScore.className = 'text-danger fw-bold';
            healthBadge.className = 'badge rounded-pill bg-danger-subtle text-danger border border-danger p-2 px-3 shadow-xs';
        }

        renderCharts(stats);
    } catch (err) {
        console.error('[ERROR] Failed to load statistics:', err);
    }
}

function renderCharts(stats) {
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    const ctxStatus = document.getElementById('statusChart').getContext('2d');

    // Destroy existing charts to prevent memory leaks/re-rendering issues
    if (trendChart) trendChart.destroy();
    if (statusChart) statusChart.destroy();

    // 1. Monthly Trend Grouped Bar Chart
    trendChart = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: stats.monthlyStats.map(s => s.month),
            datasets: [
                {
                    label: 'Total Submissions',
                    data: stats.monthlyStats.map(s => s.total),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Approved',
                    data: stats.monthlyStats.map(s => s.approved),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Rejected',
                    data: stats.monthlyStats.map(s => s.rejected),
                    backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 15 } },
                tooltip: { enabled: true, mode: 'index', intersect: false }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Status Breakdown Pie Chart
    statusChart = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [stats.approved, stats.pending, stats.rejected],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });
}

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
                    <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
                    <td>
                        <button type="button" class="btn btn-sm btn-info text-white verify-btn" data-id="${sub._id}">Verify Hash</button>
                        ${sub.status === 'pending' ? `
                            <button type="button" class="btn btn-sm btn-success action-btn" data-id="${sub._id}" data-action="approved">Approve</button>
                            <button type="button" class="btn btn-sm btn-danger action-btn" data-id="${sub._id}" data-action="rejected">Reject</button>
                        ` : ''}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error('[FATAL] loadAllSubmissions failed:', err);
    }
}

function pathHelper(fullPath) {
    const filename = fullPath.split(/[\\/]/).pop();
    return filename;
}

function showConfirmModal(message, onConfirm) {
    const modalEl = document.getElementById('confirmModal');
    const modal = new bootstrap.Modal(modalEl);
    const confirmBtn = document.getElementById('confirmBtn');
    document.getElementById('confirmMessage').innerText = message;
    
    const handler = () => {
        onConfirm();
        modal.hide();
        confirmBtn.removeEventListener('click', handler);
    };
    
    confirmBtn.addEventListener('click', handler);
    modalEl.addEventListener('hidden.bs.modal', () => {
        confirmBtn.removeEventListener('click', handler);
    }, { once: true });
    
    modal.show();
}

async function updateStatus(id, status) {
    showConfirmModal(`Mark this submission as ${status.toUpperCase()}?`, async () => {
        try {
            const res = await fetch(`${API_URL}/submissions/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId: id, status })
            });
            const data = await res.json();
            
            if (res.ok) {
                loadAllSubmissions();
                loadDashboardStats();
            } else {
                alert('Error: ' + data.msg);
            }
        } catch (err) {
            console.error('[FATAL] Fetch failed:', err);
            alert('Network error. Check console.');
        }
    });
}

// Global error catcher
window.addEventListener('unhandledrejection', event => {
    console.error('[GLOBAL ERROR] Unhandled rejection:', event.reason);
});

async function verifyIntegrity(id) {
    const modalEl = new bootstrap.Modal(document.getElementById('verifyModal'));
    const resultDiv = document.getElementById('verifyResult');

    resultDiv.className = 'alert alert-info';
    resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border text-primary me-3" role="status"></div>
            <div>
                <strong>Scanning Blockchain...</strong><br>
                Recalculating SHA256 Hash on Server Node...
            </div>
        </div>
    `;
    modalEl.show();

    setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/submissions/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId: id })
            });
            const data = await res.json();

            if (data.verified) {
                resultDiv.className = 'alert alert-success card-glass shadow-lg border-success';
                resultDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4 class="alert-heading mb-0 text-success">✅ INTEGRITY VERIFIED</h4>
                        <span class="badge bg-success">Blockchain Secure</span>
                    </div>
                    <p class="mb-3">The file on the server node perfectly matches the immutable record at Block #${data.blockchain_info.blockIndex}.</p>
                    <hr class="border-success opacity-25">
                    <div class="mt-2 mono x-small text-dark p-2 bg-light-soft rounded border">
                        <div class="mb-1"><strong>Block ID:</strong> ${data.blockchain_info.currentHash.substring(0, 16)}...</div>
                        <div class="mb-1"><strong>Prev Link:</strong> ${data.blockchain_info.prevHash.substring(0, 16)}...</div>
                        <div class="text-success"><i class="fas fa-check-circle"></i> Chain Integrity: AUDITED & SECURE</div>
                    </div>
                `;
            } else {
                resultDiv.className = 'alert alert-danger card-glass shadow-lg border-danger';
                resultDiv.innerHTML = `
                    <h4 class="alert-heading text-danger">❌ TAMPERING DETECTED</h4>
                    <p class="mb-0 text-dark-emphasis font-weight-bold">${data.msg}</p>
                    <hr class="border-danger opacity-25">
                    <p class="small mb-0 mt-2 text-danger">The file's current signature does not exist in the blockchain ledger. Reject this submission immediately.</p>
                `;
            }
        } catch (err) {
            console.error(err);
            resultDiv.className = 'alert alert-danger';
            resultDiv.innerText = 'Verification request failed';
        }
    }, 1500);
}

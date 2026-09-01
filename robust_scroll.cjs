const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldFunc = `
    highlightRecordFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewRecordId = urlParams.get('view_record');
        if (viewRecordId) {
            // Wait for auth to be fully loaded so we know our role
            setTimeout(() => {
                const readOnly = (auth.getRole() === 'supervisor');
                this.viewRecordDetails(viewRecordId, readOnly);
                
                // Reset URL so it doesn't happen again on normal navigation
                window.history.replaceState({}, document.title, "/");
            }, 800);
        }
    }
`;

const newFunc = `
    async highlightRecordFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewRecordId = urlParams.get('view_record');
        if (!viewRecordId) return;

        // Reset URL so it doesn't happen again on normal navigation
        window.history.replaceState({}, document.title, "/");

        try {
            const role = auth.getRole();
            if (!role) return;

            // Fetch record to know its date and status
            const res = await db.request('/api/recordDetails?id=' + viewRecordId);
            if (!res.ok) return;
            const data = await res.json();
            const record = data.record;

            if (role === 'admin' || role === 'engineer') {
                if (role === 'admin') UI.switchView('view-engineer');
                
                // Adjust filters to match the record so it appears in the DOM
                const dateInput = document.getElementById('engineer-date-filter');
                const statusInput = document.getElementById('engineer-status-filter');
                
                if (dateInput) dateInput.value = record.date;
                if (statusInput) statusInput.value = 'all'; // Show it regardless of status
                
                // Fetch and render records again to ensure it is in the DOM
                const records = await db.getRecordsWithDetails('all', null, role === 'admin' ? null : auth.currentUser.id, { start: record.date, end: record.date });
                UI.renderEngineerRecords(records, role);
            } else if (role === 'supervisor') {
                UI.switchView('view-supervisor');
                // loadSupervisorData already loads everything
            }

            // Wait a moment for DOM to paint
            setTimeout(() => {
                const target = document.getElementById('record-card-' + viewRecordId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add glowing rectangle effect
                    target.style.transition = "all 0.5s ease";
                    target.style.boxShadow = "0 0 20px 5px #ffd700";
                    target.style.border = "3px solid #ffd700";
                    target.style.transform = "scale(1.02)";
                    
                    // Revert scale after 1 second, but keep glow for 5 seconds
                    setTimeout(() => {
                        target.style.transform = "scale(1)";
                    }, 1000);
                    
                    setTimeout(() => {
                        target.style.boxShadow = "var(--shadow)";
                        target.style.border = "none";
                    }, 5000);
                }
            }, 800);

        } catch (e) {
            console.error(e);
        }
    }
`;

content = content.replace(oldFunc.trim(), newFunc.trim());
fs.writeFileSync("index.html", content);
console.log("Updated to scroll and glow robustly");

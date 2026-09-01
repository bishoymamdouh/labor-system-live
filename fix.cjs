const fs = require('fs');
const d = fs.readFileSync('index.html', 'utf8');

const s = `            alert(\`تم \${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح\`);
        }
        let records = await db.getAll('records');`;

const r = `            alert(\`تم \${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح\`);
        }

    // --- Reports Functions ---
    async generateReport() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const workerName = document.getElementById('filter-worker-name').value.trim().toLowerCase();
        
        if (startDate && endDate) {
            document.getElementById('print-date-range').innerText = \`الفترة من \${startDate} إلى \${endDate}\`;
        } else {
            document.getElementById('print-date-range').innerText = \`جميع السجلات من بداية العمل\`;
        }
        
        // 1. Get all approved records
        let records = await db.getAll('records');`;

fs.writeFileSync('index.html', d.replace(s, r));
console.log('Fixed generateReport');

const s2 = `                    if (currentCount > 0) {
                        badge.style.display = 'inline-block';
                } else {
                    this.lastPendingCount = currentCount;
                }`;

const r2 = `                    if (currentCount > 0) {
                        badge.style.display = 'inline-block';
                        badge.innerText = currentCount;
                        if ('setAppBadge' in navigator) {
                            navigator.setAppBadge(currentCount).catch(console.error);
                        }
                    } else {
                        badge.style.display = 'none';
                        if ('clearAppBadge' in navigator) {
                            navigator.clearAppBadge().catch(console.error);
                        }
                    }
                }
                
                if (currentCount > this.lastPendingCount && this.lastPendingCount !== -1) {
                    if (document.getElementById('view-engineer').classList.contains('active')) {
                        this.loadEngineerData().catch(e => console.error("Error reloading engineer data:", e));
                    }
                }
                
                if (this.lastPendingCount === -1) {
                    this.lastPendingCount = currentCount;
                } else {
                    this.lastPendingCount = currentCount;
                }`;

fs.writeFileSync('index.html', fs.readFileSync('index.html', 'utf8').replace(s2, r2));
console.log('Fixed badge logic');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update loadEngineerData to cache engineers
const oldLoadEng = `async loadEngineerData() {`;
const newLoadEng = `async loadEngineerData() {
        try {
            const users = await db.getAll('users');
            window.engineerUsersCache = users.filter(u => u.role === 'engineer' || u.role === 'admin');
        } catch(e) { console.error(e); }`;
if (html.includes(oldLoadEng)) {
    html = html.replace(oldLoadEng, newLoadEng);
}

// 2. Update generateRecordCardHTML
const oldActions = `let actionsHtml = \`<div class="record-card-actions flex-end" style="gap:10px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">\`;
        
        if (isEditable) {
            // Need to save workers to global context for approval to grab their values
            actionsHtml += \`
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = \${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'approved', this)"><i class="fas fa-check"></i> اعتماد</button>
                <button class="btn btn-danger btn-small" onclick="window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'rejected', this)"><i class="fas fa-times"></i> رفض</button>
            \`;
        }`;

const newActions = `let actionsHtml = '';
        if (isEditable) {
            let engineerOptions = '<option value="">-- اختر مهندس (اختياري) --</option>';
            if (window.engineerUsersCache && window.auth && window.auth.currentUser) {
                window.engineerUsersCache.filter(u => String(u.id) !== String(window.auth.currentUser.id)).forEach(u => {
                    engineerOptions += \`<option value="\${u.id}">\${u.username || u.name}</option>\`;
                });
            }
            
            actionsHtml += \`
            <div style="background: var(--surface-color); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-top: 15px;">
                <div style="flex: 1;">
                    <label style="font-size: 0.9em; margin-bottom: 5px; display: block; color: var(--text-color);">إبلاغ / تحويل إلى مهندس آخر:</label>
                    <select id="forward-eng-\${r.id}" class="modal-input" style="margin-bottom: 0;">\${engineerOptions}</select>
                </div>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="app.forwardRecord('\${r.id}', '\${r.supervisorName}', this)"><i class="fas fa-share"></i> إرسال</button>
            </div>\`;
        }
        
        actionsHtml += \`<div class="record-card-actions flex-end" style="gap:10px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">\`;
        
        if (isEditable) {
            actionsHtml += \`
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = \${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'approved', this)"><i class="fas fa-check"></i> اعتماد</button>
                <button class="btn btn-danger btn-small" onclick="window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'rejected', this)"><i class="fas fa-times"></i> رفض</button>
            \`;
        }`;

if (html.includes(oldActions)) {
    html = html.replace(oldActions, newActions);
    console.log("Actions HTML updated!");
} else {
    console.log("oldActions not found");
}

fs.writeFileSync('index.html', html, 'utf8');

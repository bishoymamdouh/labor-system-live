const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexIsEditable = /const isEditable = isAdmin \|\| \(role === 'engineer' && r\.status === 'pending'\);/;
const regexActionsHtml = /if \(isEditable\) \{\s*actionsHtml \+= \`[\s\S]*?<button class="btn btn-primary btn-small"[\s\S]*?<\/button>\s*<button class="btn btn-danger btn-small"[\s\S]*?<\/button>\s*\`;\s*\}/;

const newIsEditable = `const isEditable = isAdmin || (role === 'engineer' && r.status === 'pending') || (role === 'supervisor' && r.status === 'rejected');`;

const newActionsHtml = `if (isAdmin || (role === 'engineer' && r.status === 'pending')) {
            actionsHtml += \`
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = \${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'approved', this)"><i class="fas fa-check"></i> اعتماد</button>
                <button class="btn btn-danger btn-small" onclick="window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'rejected', this)"><i class="fas fa-times"></i> رفض</button>
            \`;
        }
        
        if (role === 'supervisor' && r.status === 'rejected') {
            actionsHtml += \`
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = \${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '\${view}-card'; app.updateRecordStatus('\${r.id}', 'pending', this)"><i class="fas fa-sync"></i> إعادة إرسال للمراجعة</button>
            \`;
        }`;

if (html.match(regexIsEditable) && html.match(regexActionsHtml)) {
    html = html.replace(regexIsEditable, newIsEditable);
    html = html.replace(regexActionsHtml, newActionsHtml);
    console.log("Supervisor edit abilities updated!");
    fs.writeFileSync('index.html', html, 'utf8');
} else {
    console.log("regex not found");
}

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /async updateRecordStatus\(recordId, status, btn = null\) \{([\s\S]*?)try \{[\s\S]*?if \(status === 'approved'\) \{/;

const newStatus = `async updateRecordStatus(recordId, status, btn = null) {
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        }
        
        let rejectReason = '';
        if (status === 'rejected') {
            rejectReason = prompt('سبب الرفض (اختياري - سيظهر للمشرف ليتمكن من التعديل):');
            if (rejectReason === null) {
                // User cancelled the prompt, abort rejection
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
                return;
            }
        }
        
        try {
            const record = await db.getById('records', recordId);
            if (record) {
                if (status === 'rejected' && rejectReason) {
                    record.rejectReason = rejectReason;
                }
                
                // If approving, check if CC engineer is selected
                if (status === 'approved') {`;

if (html.match(regexStatus)) {
    html = html.replace(regexStatus, newStatus);
    console.log("updateRecordStatus updated with reject reason prompt!");
} else {
    console.log("regexStatus not found");
}

fs.writeFileSync('index.html', html, 'utf8');

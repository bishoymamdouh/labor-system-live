const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /async updateRecordStatus\(recordId, status, btn = null\) \{([\s\S]*?if \(status === 'approved'\) \{)/;

const newStatus = `async updateRecordStatus(recordId, status, btn = null) {
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        }
        
        try {
            const record = await db.getById('records', recordId);
            if (record) {
                // If approving, check if CC engineer is selected
                if (status === 'approved') {
                    const select = document.getElementById('forward-eng-' + recordId);
                    if (select && select.value) {
                        try {
                            const supervisor = await db.getById('users', record.supervisorId);
                            const supName = supervisor ? supervisor.username : '';
                            await fetch('/api/broadcast', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    title: 'Request for your information', 
                                    message: 'تم اعتماد السركي الخاص بالمشرف ' + supName + '، يرجى الاطلاع على التفاصيل والملاحظات.', 
                                    target: [select.value] 
                                })
                            });
                        } catch (e) {
                            console.error('Failed to send FYI notification', e);
                        }
                    }
                }
                
                let prefix = window.currentCardPrefix || 'card';
                if (status === 'approved') {`;

if (html.match(regexStatus)) {
    html = html.replace(regexStatus, newStatus);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("updateRecordStatus updated for FYI notification!");
} else {
    console.log("Could not find updateRecordStatus");
}

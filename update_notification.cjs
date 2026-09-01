const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /if \(status === 'rejected' && rejectReason\) \{[\s\S]*?record\.rejectReason = rejectReason;\s*\}/;

const newStatus = `if (status === 'rejected' && rejectReason) {
                    record.rejectReason = rejectReason;
                    // Send notification to supervisor
                    try {
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title: 'تم رفض سركي', 
                                message: 'تم رفض السركي الخاص بك لوجود ملاحظات. يرجى الدخول لمراجعة السبب وتعديله.', 
                                target: [record.supervisorId],
                                url: '/?view_record=' + record.id
                            })
                        });
                    } catch (e) {
                        console.error('Failed to send rejection notification', e);
                    }
                }`;

if (html.match(regexStatus)) {
    html = html.replace(regexStatus, newStatus);
    console.log("updateRecordStatus updated with supervisor notification!");
    fs.writeFileSync('index.html', html, 'utf8');
} else {
    console.log("regexStatus not found");
}

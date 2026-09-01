const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /if \(status === 'approved' \|\| status === 'pending'\) \{/;

const newStatus = `if (status === 'pending') {
                    try {
                        let targets = [];
                        if (record.engineerId && record.engineerId !== 'admin') {
                            targets.push(record.engineerId);
                        } else {
                            const users = await db.getAll('users');
                            targets = users.filter(u => u.role === 'admin' || u.role === 'engineer').map(u => String(u.id));
                        }
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title: 'تم تعديل سركي مرفوض', 
                                message: 'قام المشرف ' + (auth.currentUser.username || auth.currentUser.name) + ' بتعديل السركي المرفوض وإعادة إرساله للمراجعة.', 
                                target: targets,
                                url: '/?view_record=' + record.id
                            })
                        });
                    } catch (e) {
                        console.error('Failed to send resubmit notification', e);
                    }
                }
                
                if (status === 'approved' || status === 'pending') {`;

if (html.match(regexStatus)) {
    html = html.replace(regexStatus, newStatus);
    
    // Also, don't re-enable button if status is pending
    const regexFinally = /\} finally \{\s*if \(btn\) \{\s*btn\.disabled = false;\s*btn\.innerHTML = origHtml;\s*\}\s*\}/;
    const newFinally = `} finally {
            if (btn && status !== 'pending' && status !== 'approved') {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }`;
    if (html.match(regexFinally)) {
        html = html.replace(regexFinally, newFinally);
    }
    
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Resubmit notification and button lock added!");
} else {
    console.log("Could not find status condition");
}

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const submitInject = `
            if (role === 'engineer') {
                alert('تم تسجيل السركي واعتماده بنجاح');
            } else {
                alert('تم إرسال السركي للاعتماد بنجاح');
                try {
                    if (engineerId) {
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: 'طلب اعتماد جديد',
                                message: 'تم إرسال سركي جديد يحتاج لاعتمادك.',
                                target: engineerId,
                                url: '/?view_record=' + recordId
                            })
                        });
                    }
                } catch(e) { console.error(e); }
            }
`;

content = content.replace(
    /if \(role === 'engineer'\) \{\s*alert\('تم تسجيل السركي واعتماده بنجاح'\);\s*\} else \{\s*alert\('تم إرسال السركي للاعتماد بنجاح'\);\s*\}/s,
    submitInject
);


const approveInject = `
            if (res.ok) {
                alert('تم التحديث بنجاح!');
                try {
                    const rec = await db.getById('records', recordId);
                    if (rec && rec.supervisorId && newStatus === 'approved') {
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: 'تم اعتماد السركي',
                                message: 'تم اعتماد السركي الخاص بك من قبل المهندس.',
                                target: rec.supervisorId,
                                url: '/?view_record=' + recordId
                            })
                        });
                    }
                } catch(e) { console.error(e); }
`;

content = content.replace(
    /if \(res\.ok\) \{\s*alert\('تم التحديث بنجاح!'\);/s,
    approveInject
);


fs.writeFileSync("index.html", content);
console.log("Injected auto-notifications");

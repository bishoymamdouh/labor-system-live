const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const jsLogic = `
        // --- Notification Management Logic ---
        let notifConfig = { scheduled: [], system: {} };
        let allUsersList = [];

        document.getElementById('menu-notifications')?.addEventListener('click', async () => {
            app.switchView('view-notifications');
            document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
            document.getElementById('menu-notifications').classList.add('active');
            
            await loadNotifData();
        });

        async function loadNotifData() {
            try {
                const [cfgRes, usrRes] = await Promise.all([
                    fetch('/api/notificationsConfig'),
                    fetch('/api/users')
                ]);
                notifConfig = await cfgRes.json();
                const usersObj = await usrRes.json();
                
                // Convert users obj to array for easier mapping
                allUsersList = Object.keys(usersObj).map(id => ({ id, ...usersObj[id] }));
                
                // Populate selects
                const userOpts = allUsersList.map(u => \`<option value="\${u.id}">\${u.name} (\${u.role})</option>\`).join('');
                document.getElementById('broadcast-users').innerHTML = userOpts;
                document.getElementById('sched-users').innerHTML = userOpts;
                
                // Populate system
                document.getElementById('sys-remind-active').checked = notifConfig.system.pendingReminderActive;
                document.getElementById('sys-remind-text').value = notifConfig.system.pendingReminderText;
                
                renderScheduledList();
            } catch (err) {
                console.error(err);
            }
        }

        function renderScheduledList() {
            const list = document.getElementById('scheduled-list');
            list.innerHTML = '';
            notifConfig.scheduled.forEach((s, idx) => {
                const el = document.createElement('div');
                el.style.border = '1px solid #ddd';
                el.style.padding = '10px';
                el.style.borderRadius = '5px';
                el.style.display = 'flex';
                el.style.justifyContent = 'space-between';
                el.style.alignItems = 'center';
                
                const rolesText = (s.targets.roles || []).join(', ');
                const usersCount = (s.targets.users || []).length;
                
                el.innerHTML = \`
                    <div>
                        <strong style="color: \${s.isActive ? '#000' : '#999'}">\${s.title}</strong> <span style="background: #eef2ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">\${s.time}</span>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">\${s.message}</div>
                        <div style="font-size: 0.75rem; color: #999; margin-top: 3px;">الوظائف: \${rolesText || '-'} | أشخاص: \${usersCount}</div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary btn-sm" onclick="editScheduled(\${idx})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteScheduled(\${idx})"><i class="fas fa-trash"></i></button>
                    </div>
                \`;
                list.appendChild(el);
            });
        }

        async function saveNotifConfig() {
            try {
                await fetch('/api/notificationsConfig', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notifConfig)
                });
                alert('تم الحفظ بنجاح!');
                renderScheduledList();
            } catch(e) {
                alert('حدث خطأ أثناء الحفظ');
            }
        }

        document.getElementById('btn-save-sys-remind')?.addEventListener('click', () => {
            notifConfig.system.pendingReminderActive = document.getElementById('sys-remind-active').checked;
            notifConfig.system.pendingReminderText = document.getElementById('sys-remind-text').value;
            saveNotifConfig();
        });

        // Add / Edit Modal
        let editingIdx = -1;
        document.getElementById('btn-add-scheduled')?.addEventListener('click', () => {
            editingIdx = -1;
            document.getElementById('modal-scheduled-title').innerText = 'إضافة إشعار مجدول';
            document.getElementById('sched-title').value = '';
            document.getElementById('sched-message').value = '';
            document.getElementById('sched-hour').value = '10';
            document.getElementById('sched-min').value = '00';
            document.getElementById('sched-ampm').value = 'AM';
            document.querySelectorAll('.sched-role').forEach(cb => cb.checked = false);
            Array.from(document.getElementById('sched-users').options).forEach(opt => opt.selected = false);
            document.getElementById('sched-active').checked = true;
            document.getElementById('modal-scheduled').style.display = 'flex';
        });

        window.editScheduled = (idx) => {
            editingIdx = idx;
            const s = notifConfig.scheduled[idx];
            document.getElementById('modal-scheduled-title').innerText = 'تعديل الإشعار';
            document.getElementById('sched-title').value = s.title;
            document.getElementById('sched-message').value = s.message;
            
            const [timeStr, ampmStr] = s.time.split(' ');
            const [h, m] = timeStr.split(':');
            document.getElementById('sched-hour').value = h;
            document.getElementById('sched-min').value = m;
            document.getElementById('sched-ampm').value = ampmStr;
            
            document.querySelectorAll('.sched-role').forEach(cb => {
                cb.checked = (s.targets.roles || []).includes(cb.value);
            });
            Array.from(document.getElementById('sched-users').options).forEach(opt => {
                opt.selected = (s.targets.users || []).includes(opt.value);
            });
            
            document.getElementById('sched-active').checked = s.isActive;
            document.getElementById('modal-scheduled').style.display = 'flex';
        };

        window.deleteScheduled = (idx) => {
            if(confirm('هل أنت متأكد من حذف هذا الإشعار المجدول؟')) {
                notifConfig.scheduled.splice(idx, 1);
                saveNotifConfig();
            }
        };

        document.getElementById('btn-save-scheduled')?.addEventListener('click', () => {
            const time = \`\${document.getElementById('sched-hour').value}:\${document.getElementById('sched-min').value} \${document.getElementById('sched-ampm').value}\`;
            const roles = Array.from(document.querySelectorAll('.sched-role:checked')).map(cb => cb.value);
            const users = Array.from(document.getElementById('sched-users').selectedOptions).map(opt => opt.value);
            
            const notif = {
                id: editingIdx > -1 ? notifConfig.scheduled[editingIdx].id : 'sched_' + Date.now(),
                title: document.getElementById('sched-title').value,
                message: document.getElementById('sched-message').value,
                time,
                targets: { roles, users },
                isActive: document.getElementById('sched-active').checked
            };
            
            if (editingIdx > -1) {
                notifConfig.scheduled[editingIdx] = notif;
            } else {
                notifConfig.scheduled.push(notif);
            }
            
            document.getElementById('modal-scheduled').style.display = 'none';
            saveNotifConfig();
        });

        // Manual Broadcast
        document.getElementById('btn-send-broadcast')?.addEventListener('click', async () => {
            const title = document.getElementById('broadcast-title').value;
            const message = document.getElementById('broadcast-message').value;
            if(!title || !message) return alert('الرجاء كتابة العنوان والنص');
            
            const roles = Array.from(document.querySelectorAll('.broadcast-role:checked')).map(cb => cb.value);
            const users = Array.from(document.getElementById('broadcast-users').selectedOptions).map(opt => opt.value);
            
            if(roles.length === 0 && users.length === 0) return alert('الرجاء اختيار المستهدفين');
            
            // Gather all user IDs based on roles + specific users
            const targetIds = new Set(users);
            if (roles.length > 0) {
                allUsersList.forEach(u => {
                    if (roles.includes(u.role)) targetIds.add(u.id);
                });
            }
            
            const btn = document.getElementById('btn-send-broadcast');
            btn.disabled = true;
            btn.innerText = 'جاري الإرسال...';
            
            try {
                const res = await fetch('/api/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target: Array.from(targetIds),
                        title,
                        message,
                        url: '/'
                    })
                });
                const json = await res.json();
                alert(\`تم إرسال الإشعار بنجاح إلى \${json.sent} أجهزة!\`);
            } catch(e) {
                alert('حدث خطأ');
            }
            
            btn.disabled = false;
            btn.innerText = 'إرسال الإشعار الآن';
        });
`;

if (!content.includes('// --- Notification Management Logic ---')) {
    content = content.replace('// --- Initialization ---', jsLogic + '\n        // --- Initialization ---');
    fs.writeFileSync("index.html", content);
    console.log("Injected JS Logic");
} else {
    console.log("JS already exists");
}

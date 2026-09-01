window.loadNotifData = async function() {
    try {
        const res = await window.db.request('/api/notificationsConfig');
        if (res.ok) {
            const config = await res.json();
            
            // Render sys remind
            // sys-remind removed
            
            
            
            
            // Render scheduled
            const list = document.getElementById('scheduled-list');
            if (list) {
                list.innerHTML = '';
                (config.scheduled || []).forEach(sched => {
                    const div = document.createElement('div');
                    div.style.cssText = "padding: 10px; border: 1px solid #ddd; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; background: #fff;";
                    const status = sched.active ? '<span style="color: green; font-size: 0.8em;"><i class="fas fa-circle"></i> يعمل</span>' : '<span style="color: red; font-size: 0.8em;"><i class="fas fa-circle"></i> متوقف</span>';
                    div.innerHTML = `
                        <div>
                            <strong>${sched.time} ${status}</strong>
                            <div style="color: #666; font-size: 0.9em; margin-top: 5px;">${sched.title ? `<b>${sched.title}:</b> ` : ''}${sched.message}</div>
                        </div>
                        <div>
                            <button class="btn btn-secondary btn-sm edit-sched-btn" data-id="${sched.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm del-sched-btn" data-id="${sched.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }
            
            window.notifConfig = config;
        }
    } catch(e) {
        console.error("Error loading notification config", e);
    }
};


document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-add-scheduled')) {
        document.getElementById('sched-id').value = '';
        document.getElementById('sched-title').value = '';
        document.getElementById('sched-message').value = '';
        document.getElementById('sched-hour').value = '10';
        document.getElementById('sched-min').value = '00';
        document.getElementById('sched-ampm').value = 'AM';
        document.querySelectorAll('.sched-role').forEach(cb => cb.checked = false);
        document.querySelectorAll('.sched-user-cb').forEach(cb => cb.checked = false);
        document.getElementById('sched-active').checked = true;
        if(document.getElementById('sched-role-all')) document.getElementById('sched-role-all').checked = false;
        if(document.getElementById('sched-user-all')) document.getElementById('sched-user-all').checked = false;
        
        document.getElementById('modal-scheduled-title').innerText = 'إضافة إشعار مجدول';
        document.getElementById('modal-scheduled').style.display = 'flex';
    }
    
    if (e.target.closest('.edit-sched-btn')) {
        const id = e.target.closest('.edit-sched-btn').dataset.id;
        const config = window.notifConfig || {};
        const sched = (config.scheduled || []).find(s => s.id === id);
        if (sched) {
            document.getElementById('sched-id').value = sched.id;
            document.getElementById('sched-title').value = sched.title || '';
            document.getElementById('sched-message').value = sched.message;
            
            const [timePart, ampm] = sched.time.split(' ');
            const [hour, min] = timePart.split(':');
            document.getElementById('sched-hour').value = hour;
            document.getElementById('sched-min').value = min;
            document.getElementById('sched-ampm').value = ampm;
            
            document.querySelectorAll('.sched-role').forEach(cb => {
                cb.checked = (sched.targets?.roles || []).includes(cb.value);
            });
            
            document.querySelectorAll('.sched-user-cb').forEach(cb => {
                cb.checked = (sched.targets?.userIds || []).includes(cb.value);
            });
            
            document.getElementById('sched-active').checked = sched.active;
            
            document.getElementById('modal-scheduled-title').innerText = 'تعديل إشعار مجدول';
            document.getElementById('modal-scheduled').style.display = 'flex';
        }
    }
    
    if (e.target.closest('.del-sched-btn')) {
        const id = e.target.closest('.del-sched-btn').dataset.id;
        if (confirm("هل أنت متأكد من حذف هذا الإشعار؟")) {
            const config = window.notifConfig || {};
            config.scheduled = (config.scheduled || []).filter(s => s.id !== id);
            
            await window.db.request('/api/notificationsConfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            await window.loadNotifData();
        }
    }
    
    if (e.target.closest('#btn-save-scheduled')) {
        const config = window.notifConfig || { scheduled: [], systemReminder: {} };
        const id = document.getElementById('sched-id').value || Date.now().toString();
        
        const sched = {
            id,
            title: document.getElementById('sched-title').value,
            message: document.getElementById('sched-message').value,
            time: `${document.getElementById('sched-hour').value}:${document.getElementById('sched-min').value} ${document.getElementById('sched-ampm').value}`,
            targets: {
                roles: Array.from(document.querySelectorAll('.sched-role:checked')).map(cb => cb.value),
                userIds: Array.from(document.querySelectorAll('.sched-user-cb:checked')).map(cb => cb.value)
            },
            active: document.getElementById('sched-active').checked
        };
        
        if (!sched.message) return alert('الرجاء إدخال نص الإشعار');
        if (sched.targets.roles.length === 0 && sched.targets.userIds.length === 0) {
            return alert('الرجاء تحديد مستهدف واحد على الأقل');
        }
        
        const existingIdx = config.scheduled.findIndex(s => s.id === id);
        if (existingIdx >= 0) config.scheduled[existingIdx] = sched;
        else config.scheduled.push(sched);
        
        await window.db.request('/api/notificationsConfig', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        document.getElementById('modal-scheduled').style.display = 'none';
        await window.loadNotifData();
    }
});

// Add logic to auto-select users when a role is clicked
// Add logic to auto-select users when a role is clicked
document.addEventListener('change', (e) => {
    if (e.target.id === 'sched-role-all') {
        const isChecked = e.target.checked;
        document.querySelectorAll('.sched-role').forEach(cb => {
            cb.checked = isChecked;
            // Also trigger the user selection logic
            document.querySelectorAll('.sched-user-cb').forEach(userCb => {
                if (userCb.dataset.role === cb.value) {
                    userCb.checked = isChecked;
                }
            });
        });
    }
    
    if (e.target.id === 'sched-user-all') {
        const isChecked = e.target.checked;
        document.querySelectorAll('.sched-user-cb').forEach(cb => {
            cb.checked = isChecked;
        });
    }

    if (e.target.classList.contains('sched-role')) {
        const role = e.target.value;
        const isChecked = e.target.checked;
        
        // Uncheck 'Select All Roles' if a role is unchecked
        if (!isChecked && document.getElementById('sched-role-all')) {
            document.getElementById('sched-role-all').checked = false;
        }
        
        document.querySelectorAll('.sched-user-cb').forEach(cb => {
            if (cb.dataset.role === role) {
                cb.checked = isChecked;
            }
        });
    }
    
    if (e.target.classList.contains('sched-user-cb')) {
        const isChecked = e.target.checked;
        // Uncheck 'Select All Users' if a user is unchecked
        if (!isChecked && document.getElementById('sched-user-all')) {
            document.getElementById('sched-user-all').checked = false;
        }
    }
});


// Update the active nav link for view-notifications to load data
document.body.addEventListener('click', async (e) => {
    const link = e.target.closest('a[data-view="view-notifications"]');
    if (link) {
        if (window.loadNotifData) {
            await window.loadNotifData();
        }
    }
});


setTimeout(() => {
    if (typeof UI !== 'undefined' && UI.renderUsersTable) {
        const origRenderUsersTable = UI.renderUsersTable;
        UI.renderUsersTable = function(users, currentUserId) {
            origRenderUsersTable(users, currentUserId);
            
            const schedContainer = document.getElementById('sched-users-container');
            const rolesContainer = document.getElementById('sched-roles-container');
            
            if (rolesContainer) {
                const distinctRoles = [...new Set(users.map(u => u.role))];
                rolesContainer.innerHTML = `<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; width: 100%; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold;"><input type="checkbox" id="sched-role-all" style="width: 16px; height: 16px;"> اختيار الكل</label>`;
                distinctRoles.forEach(role => {
                    const roleName = auth ? auth.getRoleNameAr(role) : role;
                    rolesContainer.innerHTML += `<label style="display: flex; align-items: center; cursor: pointer; gap: 8px;"><input type="checkbox" class="sched-role" value="${role}" style="width: 16px; height: 16px;"> ${roleName}</label>`;
                });
            }
            
            if (schedContainer) {
                schedContainer.innerHTML = `<label style="display: flex; align-items: center; cursor: pointer; padding: 5px 10px; border-bottom: 1px solid #ddd; gap: 10px; font-weight: bold;"><input type="checkbox" id="sched-user-all" style="width: 16px; height: 16px;"> اختيار الكل</label>`;
                users.forEach(u => {
                    const roleName = auth ? auth.getRoleNameAr(u.role) : u.role;
                    const userName = u.username === 'admin' ? 'Bishoy Mamdouh' : u.username;
                    
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.cursor = 'pointer';
                    label.style.padding = '5px 10px';
                    label.style.borderBottom = '1px solid #eee';
                    label.style.gap = '10px';
                    
                    label.innerHTML = `<input type="checkbox" class="sched-user-cb" value="${u.id}" data-role="${u.role}" style="width: 16px; height: 16px;"> ${userName} <span style="font-size: 0.8em; color: #888;">(${roleName})</span>`;
                    
                    schedContainer.appendChild(label);
                });
            }
        };
        
        // Trigger it immediately with current users if they exist
        if (window.usersMap) {
            UI.renderUsersTable(Object.values(window.usersMap), auth ? auth.currentUser.id : null);
        } else if (app && typeof app.loadAdminData === 'function') {
            app.loadAdminData();
        }
    }
}, 1000);


const fs = require("fs");
let content = fs.readFileSync("notifications.js", "utf8");

const renderFuncRegex = /UI\.renderUsersTable = function\(users, currentUserId\) \{[\s\S]*?\};\n/g;

const newRenderFunc = `UI.renderUsersTable = function(users, currentUserId) {
            origRenderUsersTable(users, currentUserId);
            
            const schedContainer = document.getElementById('sched-users-container');
            const rolesContainer = document.getElementById('sched-roles-container');
            
            if (rolesContainer) {
                const distinctRoles = [...new Set(users.map(u => u.role))];
                rolesContainer.innerHTML = \`<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; width: 100%; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold;"><input type="checkbox" id="sched-role-all" style="width: 16px; height: 16px;"> اختيار الكل</label>\`;
                distinctRoles.forEach(role => {
                    const roleName = auth ? auth.getRoleNameAr(role) : role;
                    rolesContainer.innerHTML += \`<label style="display: flex; align-items: center; cursor: pointer; gap: 8px;"><input type="checkbox" class="sched-role" value="\${role}" style="width: 16px; height: 16px;"> \${roleName}</label>\`;
                });
            }
            
            if (schedContainer) {
                schedContainer.innerHTML = \`<label style="display: flex; align-items: center; cursor: pointer; padding: 5px 10px; border-bottom: 1px solid #ddd; gap: 10px; font-weight: bold;"><input type="checkbox" id="sched-user-all" style="width: 16px; height: 16px;"> اختيار الكل</label>\`;
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
                    
                    label.innerHTML = \`<input type="checkbox" class="sched-user-cb" value="\${u.id}" data-role="\${u.role}" style="width: 16px; height: 16px;"> \${userName} <span style="font-size: 0.8em; color: #888;">(\${roleName})</span>\`;
                    
                    schedContainer.appendChild(label);
                });
            }
        };
`;

content = content.replace(renderFuncRegex, newRenderFunc);

const eventListenerRegex = /document\.addEventListener\('change', \(e\) => \{[\s\S]*?\}\);/g;
const newEventListener = `// Add logic to auto-select users when a role is clicked
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
});`;

content = content.replace(eventListenerRegex, newEventListener);

fs.writeFileSync("notifications.js", content);
console.log("Updated notifications.js for Select All functionality!");

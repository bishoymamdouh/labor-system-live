
// API Wrapper for Deno Backend

class Database {
    async init() {
        console.log("API Database Initialized");
        return true;
    }

    async request(url, options = {}, retries = 3) {
        options.headers = options.headers || {};
        options.headers['Bypass-Tunnel-Reminder'] = 'true';
        
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) {
                    return res;
                }
                if (res.status !== 502 && res.status !== 504) {
                    throw new Error(`HTTP error: ${res.status}`);
                }
            } catch (err) {
                if (i === retries - 1) throw err;
            }
            // Wait 500ms before retrying
            await new Promise(r => setTimeout(r, 500));
        }
        throw new Error('Max retries reached');
    }

    async add(collectionName, data) {
        const res = await this.request(`/api/${collectionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        return result.id;
    }

    async setWithId(collectionName, id, data) {
        const res = await this.request(`/api/${collectionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data })
        });
        return id;
    }

    async update(collectionName, id, data) {
        await this.request(`/api/${collectionName}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    }

    async getAll(collectionName) {
        const res = await this.request(`/api/${collectionName}`);
        return await res.json();
    }

    async getById(collectionName, id) {
        const res = await this.request(`/api/${collectionName}?id=${id}`);
        return await res.json();
    }

    async getByField(collectionName, field, value) {
        const res = await this.request(`/api/${collectionName}?${field}=${encodeURIComponent(value)}`);
        return await res.json();
    }

    async delete(collectionName, id) {
        await this.request(`/api/${collectionName}?id=${id}`, {
            method: 'DELETE'
        });
        return true;
    }

    async getRecordsWithDetails(filterStatus = null, supervisorId = null, engineerId = null, dateRange = null) {
        let res = await this.request('/api/allRecordsDetails');
        let records = await res.json();
        
        if (filterStatus) records = records.filter(r => r.status === filterStatus);
        if (supervisorId) records = records.filter(r => String(r.supervisorId) === String(supervisorId));
        if (engineerId) records = records.filter(r => String(r.engineerId) === String(engineerId));

        if (dateRange && dateRange.start && dateRange.end) {
            records = records.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
        }

        return records.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            
            const createdB = b.createdAt ? new Date(b.createdAt) : 0;
            const createdA = a.createdAt ? new Date(a.createdAt) : 0;
            return createdB - createdA;
        });
    }
}

const db = new Database();

// Authentication & Role Management (Firebase Adapted)

class Auth {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        await db.init();
        await this.checkDefaultAdmin();
        this.loadSession();
    }

    async checkDefaultAdmin() {
        try {
            const adminDoc = await db.getById('users', 'admin_default_id');
            if (!adminDoc) {
                // Create default admin if it doesn't exist
                await db.setWithId('users', 'admin_default_id', {
                    username: 'admin',
                    password: '123', // In a real app, this should be hashed, or use Firebase Auth
                    role: 'admin'
                });
                console.log("Default admin created on Firebase: admin / 123");
            }
        } catch (e) {
            console.error("Error checking default admin:", e);
        }
    }

    async login(username, password) {
        // Query users collection for matching username and password
        const users = await db.getByField('users', 'username', username);
        const user = users.find(u => u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('labor_app_user', JSON.stringify(user));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('labor_app_user');
        window.location.reload();
    }

    loadSession() {
        const saved = localStorage.getItem('labor_app_user');
        if (saved) {
            this.currentUser = JSON.parse(saved);
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getRole() {
        return this.currentUser ? this.currentUser.role : null;
    }
    
    getRoleNameAr(role) {
        const roles = {
            'admin': 'E/J1 'DF8'E',
            'supervisor': 'E41A',
            'surveyor': 'E3'-',
            'warehouse_manager': 'E/J1 E.2F',
            'operator_supervisor': 'E41A E4:D',
            'engineer': 'EGF/3'
        };
        return roles[role] || ':J1 E-//';
    }
}

const auth = new Auth();

// UI Helpers and Components

class UI {
    static showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.remove('hidden');
        }
    }

    static updateNavigation(role) {
        const sidebar = document.getElementById('sidebar');
        const navLinks = document.getElementById('nav-links');
        
        if (!role) {
            sidebar.classList.add('hidden');
            return;
        }

        sidebar.classList.remove('hidden');
        navLinks.innerHTML = '';

        if (role === 'admin') {
            navLinks.innerHTML += `
                <li><a href="#" data-view="view-admin"><i class="fas fa-users-cog"></i> DH-) 'D%/'1)</a></li>
                <li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"></i> '9*E'/ 'D31'CJ <span id="nav-badge-engineer" class="badge-glow" style="background: red; border-radius: 5px; padding: 2px 6px; font-size: 0.8em; margin-right: 5px; display: none;">0</span></a></li>
                <li><a href="#" data-view="view-supervisor"><i class="fas fa-file-signature"></i> *3,JD 31CJ</a></li>
                <li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"></i> 'D*B'1J1 'DE,E9)</a></li>
            `;
        } else if (role === 'engineer') {
            navLinks.innerHTML += `
                <li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"></i> '9*E'/ 'D31'CJ <span id="nav-badge-engineer" class="badge-glow" style="background: red; border-radius: 5px; padding: 2px 6px; font-size: 0.8em; margin-right: 5px; display: none;">0</span></a></li>
                <li><a href="#" data-view="view-supervisor"><i class="fas fa-file-signature"></i> *3,JD 31CJ</a></li>
                <li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"></i> 'D*B'1J1 'DE,E9)</a></li>
            `;
        } else if (role === 'supervisor' || role === 'surveyor' || role === 'warehouse_manager' || role === 'operator_supervisor') {
            navLinks.innerHTML += `
                <li><a href="#" data-view="view-supervisor"><i class="fas fa-file-signature"></i> *3,JD 31CJ</a></li>
            `;
        }
        
        // Active link logic
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                UI.showView(link.getAttribute('data-view'));
            });
        });
        
        // Select first tab by default
        if (links.length > 0) {
            links[0].classList.add('active');
            UI.showView(links[0].getAttribute('data-view'));
        }
    }

    static renderUsersTable(users, currentUserId) {
        const tbody = document.getElementById('users-table-body');
        if (tbody) tbody.innerHTML = '';
        
        const broadcastUserList = document.getElementById('broadcast-user-list');
        if (broadcastUserList) {
            broadcastUserList.innerHTML = '';
        }
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.id = `user-row-${user.id}`;
            const userPic = user.profilePic ? `<img src="${user.profilePic}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; margin-left:10px; vertical-align:middle; border:1px solid var(--primary-color);">` : `<i class="fas fa-user-circle" style="font-size:30px; margin-left:10px; vertical-align:middle; color:var(--text-muted);"></i>`;
            tr.innerHTML = `
                <td class="user-col-name" style="display:flex; align-items:center;">${userPic} <span>${user.username === 'admin' ? 'Bishoy Mamdouh' : user.username}</span></td>
                <td class="user-col-pass" data-pass="${user.password}">********</td>
                <td class="user-col-role"><span class="badge badge-approved" data-role="${user.role}">${auth.getRoleNameAr(user.role)}</span></td>
                <td class="user-col-actions">
                    <button class="btn-icon text-success" onclick="app.copyInviteLink('${user.id}')" title="F3. 1'(7 'D/9H) 'DE('41"><i class="fas fa-link"></i></button>
                    <button class="btn-icon text-primary" onclick="app.editUser('${user.id}')" title="*9/JD (J'F'* 'DE3*./E"><i class="fas fa-edit"></i></button>
                    ${user.id !== currentUserId ? `
                        <button class="btn-icon text-danger" onclick="app.deleteUser('${user.id}')" title="-0A"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            `;
            if (tbody) tbody.appendChild(tr);

            if (broadcastUserList) {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.padding = '10px 15px';
                label.style.cursor = 'pointer';
                label.style.margin = '0';
                label.style.borderBottom = '1px solid #eee';
                label.style.transition = 'background 0.2s';
                label.addEventListener('mouseover', () => label.style.background = '#f0f4f8');
                label.addEventListener('mouseout', () => label.style.background = 'transparent');
                
                const name = user.username === 'admin' ? 'Bishoy Mamdouh' : (user.username || '(/HF '3E');
                
                label.innerHTML = `
                    <input type="checkbox" class="broadcast-user-checkbox" value="${user.id}" checked style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-color);"> 
                    <span style="color: #333; font-weight: bold; font-size: 14px; margin-right: 10px;">${name}</span>
                `;
                broadcastUserList.appendChild(label);
            }
        });
    }

    static renderDirWorkersTable(workers) {
        const tbody = document.getElementById('dir-workers-table-body');
        tbody.innerHTML = '';
        
        workers.forEach(w => {
            const tr = document.createElement('tr');
            tr.id = `dir-worker-row-${w.id}`;
            tr.innerHTML = `
                <td class="dir-col-name">${w.name}</td>
                <td class="dir-col-type">${w.type}</td>
                <td class="dir-col-amount">${w.defaultAmount}</td>
                <td class="dir-col-actions">
                    <button class="btn-icon text-primary" onclick="app.editDirWorker('${w.id}')" title="*9/JD"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon text-danger" onclick="app.deleteDirWorker('${w.id}')" title="-0A"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    static async renderEngineerOptions() {
        const users = await db.getAll('users');
        const role = auth.getRole();
        const engineers = users.filter(u => u.role === 'engineer' || u.role === 'admin');
        const select = document.getElementById('record-engineer');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>'.*1 'DEGF/3</option>';
            engineers.forEach(eng => {
                let displayName = eng.username === 'admin' ? 'Bishoy Mamdouh' : eng.username;
                let isCurrent = (eng.id === auth.currentUser.id);
                let selected = ((role === 'engineer' || role === 'admin') && isCurrent) ? 'selected' : '';
                select.innerHTML += `<option value="${eng.id}" ${selected}>${displayName}</option>`;
            });
            if (role === 'engineer' || role === 'admin') {
                select.disabled = true;
            } else {
                select.disabled = false;
            }
        }
    }

    static generateRecordCardHTML(r, role = 'admin', view = 'default') {
        const statusBadge = this.getStatusBadge(r.status);
        const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        let headerHtml = `
            <div class="card mb-30" style="margin-bottom: 30px;">
                <div class="record-card-header flex-between mb-10" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                    <div>
                        <strong>${r.date}</strong> <span dir="ltr" style="font-size:0.85em; color:var(--text-muted);">(${timeStr})</span>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div class="record-card-info form-row mb-10" style="align-items: center;">
                    <div class="half"><strong>'DE41A:</strong> <span class="badge-glow badge-glow-supervisor"><i class="fas fa-user-tie"></i> ${r.supervisorName === 'admin' ? 'Bishoy Mamdouh' : r.supervisorName}</span></div>
                    <div class="half"><strong>'DEGF/3:</strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"></i> ${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</span></div>
                </div>
        `;
        
        // Editable if Admin OR (Engineer and Pending)
        const isAdmin = role === 'admin';
        const isEditable = isAdmin || (role === 'engineer' && r.status === 'pending');
        
        let workersHtml = `
            <div class="table-responsive mb-10">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>'D'3E</th>
                            <th>'DFH9</th>
                            <th>'DJHEJ)</th>
                            <th>'DEC'F</th>
                            <th>.5E</th>
                            <th>ED'-8'*</th>
                            ${isEditable ? '<th>%,1'!'*</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let currentTotal = r.totalAmount || 0;
        
        (r.workers || []).forEach(w => {
            if (isEditable && !w.isDeleted) {
                workersHtml += `
                    <tr>
                        <td>${w.name}</td>
                        <td>
                            <select id="${view}-card-type-${w.id}" class="modal-input" style="width: 110px;" onchange="app.onModalTypeChange('${w.id}', '${w.name}', '${view}-card')">
                                <option value="9'ED" ${w.type==='9'ED'?'selected':''}>9'ED</option>
                                <option value="F-'*" ${w.type==='F-'*'?'selected':''}>F-'*</option>
                                <option value="5F'J9I" ${w.type==='5F'J9I'?'selected':''}>5F'J9I</option>
                                <option value="E41A 9E'D" ${w.type==='E41A 9E'D'?'selected':''}>E41A 9E'D</option>
                                <option value="(HAJG" ${w.type==='(HAJG'?'selected':''}>(HAJG</option>
                                <option value="'.1I" ${w.type===''.1I'?'selected':''}>'.1I</option>
                            </select>
                        </td>
                        <td><input type="number" id="${view}-card-amount-${w.id}" value="${w.amount}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="${view}-card-location-${w.id}" value="${w.location || ''}" class="modal-input" style="width: 110px;"></td>
                        <td><input type="number" id="${view}-card-deduction-${w.id}" value="${w.deduction || 0}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="${view}-card-notes-${w.id}" value="${w.notes || ''}" class="modal-input" style="min-width: 130px; width: 100%;"></td>
                        <td>
                            <button type="button" class="btn-icon text-danger" onclick="app.removeWorkerFromRecord('${r.id}', '${w.id}')" title="-0A 'D9'ED"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            } else {
                let deletedStyle = w.isDeleted ? 'text-decoration: line-through; opacity: 0.6;' : '';
                let deletedBadge = w.isDeleted ? '<span class="badge badge-rejected" style="margin-right: 5px;">E-0HA</span>' : '';
                let deductionBadge = (!w.isDeleted && w.deduction > 0) ? `<span class="badge badge-pending" style="margin-right: 5px; font-size: 0.75rem;">.5E ${w.deduction}</span>` : '';
                let deductionVal = w.isDeleted ? '-' : (w.deduction || 0);
                
                let actionTd = isEditable ? '<td></td>' : '';
                
                workersHtml += `
                    <tr style="${deletedStyle}">
                        <td>${w.name} ${deletedBadge}</td>
                        <td>${w.type}</td>
                        <td>${w.amount}</td>
                        <td>${w.location || '-'}</td>
                        <td>${deductionBadge ? deductionBadge : deductionVal}</td>
                        <td>${w.notes || '-'}</td>
                        ${actionTd}
                    </tr>
                `;
            }
        });
        
        workersHtml += `
                    </tbody>
                </table>
            </div>
            <div class="flex-between mb-10">
                <strong>'D%,E'DJ: ${currentTotal.toLocaleString()} ,FJ)</strong>
                <small>'D9E'D: ${r.totalWorkers}</small>
            </div>
        `;
        
        let actionsHtml = `<div class="record-card-actions flex-end" style="gap:10px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">`;
        
        if (isEditable) {
            // Need to save workers to global context for approval to grab their values
            actionsHtml += `
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = ${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '${view}-card'; app.updateRecordStatus('${r.id}', 'approved')"><i class="fas fa-check"></i> '9*E'/</button>
                <button class="btn btn-danger btn-small" onclick="window.currentCardPrefix = '${view}-card'; app.updateRecordStatus('${r.id}', 'rejected')"><i class="fas fa-times"></i> 1A6</button>
            `;
        }
        
        if (role === 'supervisor' && r.status === 'pending') {
            actionsHtml += `<button class="btn btn-danger btn-small delete-record-btn" data-record-id="${r.id}"><i class="fas fa-trash"></i> -0A 'D31CJ</button>`;
        }
        
        if (isAdmin) {
             actionsHtml += `<button class="btn btn-danger btn-small delete-record-btn" data-record-id="${r.id}"><i class="fas fa-trash"></i> -0A EF 'DF8'E</button>`;
        }
        
        actionsHtml += `</div></div>`; // close card
        
        return headerHtml + workersHtml + actionsHtml;
    }

    static renderSupervisorRecords(records) {
        const container = document.getElementById('supervisor-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">D' *H,/ 31'CJ 3'(B)</div>';
            return;
        }

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, 'supervisor', 'supervisor');
        });
    }

    static renderEngineerRecords(records, role = 'engineer') {
        const container = document.getElementById('engineer-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">D' *H,/ 7D('* DD916</div>';
            return;
        }

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, role, 'engineer');
        });
    }

    static renderAdminRecords(records) {
        const container = document.getElementById('admin-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">D' *H,/ 31'CJ -*I 'D"F</div>';
            return;
        }
        
        // sort by newest
        records.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, 'admin', 'admin');
        });
    }
    
    static async renderRecordDetailsModal(record, workers, readOnly = false) {
        const modal = document.getElementById('record-modal');
        const body = document.getElementById('record-modal-body');
        const footer = document.getElementById('record-modal-footer');
        
        // Store workers globally for app.js to access when approving
        window.currentModalWorkers = workers;
        
        let html = `
            <div class="form-row mb-10" style="align-items: center;">
                <div class="half"><strong>'D*'1J.:</strong> ${record.date}</div>
                <div class="half"><strong>'DE41A:</strong> <span class="badge-glow badge-glow-supervisor"><i class="fas fa-user-tie"></i> ${record.supervisorName === 'admin' ? 'Bishoy Mamdouh' : record.supervisorName}</span></div>
            </div>
            <div style="overflow-x:auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>'D'3E</th>
                        <th>'DFH9</th>
                        <th>'DJHEJ)</th>
                        <th>EC'F 'D9ED</th>
                        <th>.5E</th>
                        <th>ED'-8'*</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        workers.forEach(w => {
            if (readOnly) {
                html += `
                    <tr>
                        <td>${w.name}</td>
                        <td>${w.type}</td>
                        <td>${w.amount}</td>
                        <td>${w.location || ''}</td>
                        <td>${w.deduction || 0}</td>
                        <td>${w.notes || ''}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td>${w.name}</td>
                        <td>
                            <select id="modal-type-${w.id}" class="modal-input" style="width: 110px;" onchange="app.onModalTypeChange('${w.id}', '${w.name}')">
                                <option value="9'ED" ${w.type==='9'ED'?'selected':''}>9'ED</option>
                                <option value="F-'*" ${w.type==='F-'*'?'selected':''}>F-'*</option>
                                <option value="5F'J9I" ${w.type==='5F'J9I'?'selected':''}>5F'J9I</option>
                                <option value="E41A 9E'D" ${w.type==='E41A 9E'D'?'selected':''}>E41A 9E'D</option>
                                <option value="(HAJG" ${w.type==='(HAJG'?'selected':''}>(HAJG</option>
                                <option value="'.1I" ${w.type===''.1I'?'selected':''}>'.1I</option>
                            </select>
                        </td>
                        <td><input type="number" id="modal-amount-${w.id}" value="${w.amount}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="modal-location-${w.id}" value="${w.location || ''}" class="modal-input" style="width: 110px;"></td>
                        <td><input type="number" id="modal-deduction-${w.id}" value="${w.deduction || 0}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="modal-notes-${w.id}" value="${w.notes || ''}" class="modal-input" style="min-width: 130px; width: 100%;"></td>
                    </tr>
                `;
            }
        });
        
        html += `
                </tbody>
            </table>
            </div>
            <div style="margin-top: 10px; font-weight: bold;">'D%,E'DJ DDE(D:: ${(record.totalAmount || workers.reduce((sum, w) => sum + (Number(w.amount) || 0) - (Number(w.deduction) || 0), 0)).toLocaleString()} ,FJ)</div>
            ${readOnly ? '' : '<div style="font-size: 0.9em; color: #666;">JECFC *9/JD #J (J'F'* #9D'G B(D 'D'9*E'/. 3J*E -3'( 'D%,E'DJ 'DFG'&J *DB'&J'K.</div>'}
        `;
        
        body.innerHTML = html;
        
        if (readOnly || record.status !== 'pending') {
            footer.classList.add('hidden');
        } else {
            footer.classList.remove('hidden');
            document.getElementById('approve-record-btn').onclick = () => {
                window.currentCardPrefix = 'modal';
                app.updateRecordStatus(record.id, 'approved');
            };
            document.getElementById('reject-record-btn').onclick = () => {
                window.currentCardPrefix = 'modal';
                app.updateRecordStatus(record.id, 'rejected');
            };
        }
        
        modal.classList.remove('hidden');
    }

    static getStatusBadge(status) {
        if (status === 'pending') return '<span class="badge badge-pending">BJ/ 'DE1',9)</span>';
        if (status === 'approved') return '<span class="badge badge-approved">E9*E/</span>';
        if (status === 'rejected') return '<span class="badge badge-rejected">E1AH6</span>';
        return status;
    }
    
    static renderReportResults(workers, recordsMap, usersMap) {
        const tbody = document.getElementById('report-results-list');
        tbody.innerHTML = '';
        
        // Remove old generic search container if it exists
        const oldSearch = document.getElementById('report-search-container');
        if (oldSearch) oldSearch.remove();
        
        let totalDays = 0;
        let totalAmount = 0;

        if (workers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">D' *H,/ (J'F'* E7'(B) DD(-+</td></tr>';
        } else {
            workers.forEach(w => {
                const record = recordsMap[w.recordId];
                if(record && record.status === 'approved') {
                    const supervisorName = usersMap[record.supervisorId] ? usersMap[record.supervisorId].username : ':J1 E91HA';
                    const engineerName = usersMap[record.engineerId] ? usersMap[record.engineerId].username : ':J1 E91HA';
                    const amount = Number(w.amount) || 0;
                    const deduction = Number(w.deduction) || 0;
                    const netAmount = amount - deduction;

                    totalDays += 1;
                    totalAmount += netAmount;
                    
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${w.name}</strong></td>
                            <td>${w.type}</td>
                            <td>${supervisorName}</td>
                            <td style="white-space: nowrap;">${record.date}</td>
                            <td>${amount}</td>
                            <td>${deduction}</td>
                            <td><strong>${netAmount}</strong></td>
                            <td style="white-space: nowrap;"><span class="badge-glow badge-glow-supervisor" style="font-size: 0.7em; padding: 2px 4px; font-weight: normal;"><i class="fas fa-hard-hat"></i> ${engineerName}</span></td>
                            <td>${w.notes || ''}</td>
                        </tr>
                    `;
                }
            });
        }
        
        document.getElementById('report-total-days').innerText = totalDays;
        document.getElementById('report-total-amount').innerText = totalAmount.toLocaleString();
        
        // Apply column filters (Excel style)
        setTimeout(() => this.applyExcelFilters(tbody), 0);
    }
    
    static applyExcelFilters(tbody) {
        const table = tbody.closest('table');
        const theadRow = table.querySelector('thead tr');
        
        // Initialize filter selects if not already there
        if (!theadRow.dataset.filtersInit) {
            theadRow.dataset.filtersInit = "true";
            Array.from(theadRow.children).forEach((th, index) => {
                // Add filter for Name (0), Type (1), Supervisor (2), Date (3), Engineer (7)
                if ([0, 1, 2, 3, 7].includes(index)) {
                    const originalText = th.innerText.trim();
                    th.innerHTML = '';
                    
                    const container = document.createElement('div');
                    container.className = 'screen-only';
                    container.style.position = 'relative';
                    container.style.display = 'inline-block';
                    
                    const select = document.createElement('select');
                    select.className = 'report-col-filter';
                    select.dataset.colIndex = index;
                    select.style.appearance = 'none';
                    select.style.border = 'none';
                    select.style.background = 'transparent';
                    select.style.color = 'inherit';
                    select.style.fontWeight = 'inherit';
                    select.style.fontSize = 'inherit';
                    select.style.fontFamily = 'inherit';
                    select.style.cursor = 'pointer';
                    select.style.outline = 'none';
                    select.style.paddingLeft = '15px';
                    select.style.textAlign = 'center';
                    select.innerHTML = `<option value="">${originalText}</option>`;
                    
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-caret-down';
                    icon.style.position = 'absolute';
                    icon.style.left = '0';
                    icon.style.top = '50%';
                    icon.style.transform = 'translateY(-50%)';
                    icon.style.pointerEvents = 'none';
                    
                    container.appendChild(select);
                    container.appendChild(icon);
                    
                    const printSpan = document.createElement('span');
                    printSpan.className = 'print-only-text';
                    printSpan.innerText = originalText;
                    
                    th.appendChild(printSpan);
                    th.appendChild(container);
                    
                    select.addEventListener('change', () => this.filterExcelTable(tbody));
                }
            });
        }
        
        // Populate options based on current tbody content
        const selects = theadRow.querySelectorAll('select.report-col-filter');
        selects.forEach(select => {
            const colIndex = parseInt(select.dataset.colIndex);
            const uniqueValues = new Set();
            
            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
                if (tr.children.length > 1) { // Ignore empty rows
                    let text = tr.children[colIndex].innerText.trim();
                    if(colIndex === 0) text = tr.children[colIndex].querySelector('strong').innerText.trim();
                    uniqueValues.add(text);
                }
            });
            
            const firstOptText = select.options[0].innerText;
            const currentValue = select.value;
            select.innerHTML = `<option value="">${firstOptText}</option>`;
            Array.from(uniqueValues).sort().forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.innerText = val;
                if (val === currentValue) opt.selected = true;
                select.appendChild(opt);
            });
        });
        
        // Run initial filter to update counts
        this.filterExcelTable(tbody);
    }
    
    static filterExcelTable(tbody) {
        const selects = tbody.closest('table').querySelectorAll('thead select.report-col-filter');
        const filters = Array.from(selects).map(s => ({ index: parseInt(s.dataset.colIndex), value: s.value }));
        
        let visibleCount = 0;
        let visibleTotal = 0;
        let visibleDeduction = 0;
        
        Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
            if (tr.children.length <= 1) return; // empty row
            
            let show = true;
            filters.forEach(f => {
                if (f.value !== '') {
                    let cellVal = tr.children[f.index].innerText.trim();
                    if(f.index === 0) cellVal = tr.children[f.index].querySelector('strong').innerText.trim();
                    if (cellVal !== f.value) show = false;
                }
            });
            
            tr.style.display = show ? '' : 'none';
            
            if (show) {
                visibleCount++;
                visibleTotal += parseFloat(tr.children[4].innerText.trim() || 0);
                visibleDeduction += parseFloat(tr.children[5].innerText.trim() || 0);
            }
        });
        
        const netTotal = visibleTotal - visibleDeduction;
        
        document.getElementById('report-total-days').innerText = visibleCount;
        document.getElementById('report-total-amount').innerText = netTotal.toLocaleString();
        
        const footerTotal = document.getElementById('report-footer-total-amount');
        const footerDeduction = document.getElementById('report-footer-total-deduction');
        const footerNet = document.getElementById('report-footer-net-amount');
        if (footerTotal) footerTotal.innerText = visibleTotal.toLocaleString();
        if (footerDeduction) footerDeduction.innerText = visibleDeduction.toLocaleString();
        if (footerNet) footerNet.innerText = netTotal.toLocaleString();
    }
}

// Main Application Logic

class App {
    constructor() {
        this.currentWorkers = [];
        this.directoryWorkers = [];
        this.init();
    }

    async exportStyledExcel() {
        try {
            const btn = document.querySelector('button[onclick="app.exportStyledExcel()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ,'1J 'D*-6J1...';
            btn.disabled = true;

            // 1. Trigger the background database backup just like auto-backup
            await fetch('/api/backup', { method: 'POST' });

            // 2. Clone the table to parse
            const table = document.getElementById('reports-table-full');
            if (!table) throw new Error("Table not found");
            const clone = table.cloneNode(true);
            clone.querySelectorAll('.screen-only').forEach(el => el.remove());

            // 3. Create ExcelJS Workbook
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('*A'5JD 'D9E'D)', { views: [{ rightToLeft: true }] });

            // Set column widths
            ws.columns = [
                { width: 25 }, { width: 15 }, { width: 20 }, { width: 15 },
                { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 }, { width: 30 }
            ];

            // 4. Iterate over rows
            const rows = clone.querySelectorAll('tr');
            rows.forEach((tr, rIndex) => {
                const excelRow = ws.addRow([]);
                let colIndex = 1;
                
                const cells = tr.querySelectorAll('th, td');
                cells.forEach(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
                    const isTh = cell.tagName.toLowerCase() === 'th';
                    
                    const excelCell = excelRow.getCell(colIndex);
                    
                    let val = cell.innerText.trim();
                    // Convert numeric strings to numbers for better Excel support
                    if (!isNaN(val) && val !== '' && !val.includes('-')) {
                        val = Number(val);
                    }
                    excelCell.value = val;
                    
                    excelCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    excelCell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };

                    if (isTh) {
                        excelCell.font = { bold: true };
                        excelCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFEFEFEF' }
                        };
                    } else if (cell.style.fontWeight === 'bold' || cell.querySelector('strong')) {
                        excelCell.font = { bold: true };
                    }

                    if (colspan > 1) {
                        ws.mergeCells(excelRow.number, colIndex, excelRow.number, colIndex + colspan - 1);
                        // Apply border to merged cells as well
                        for(let c = 1; c < colspan; c++) {
                            const mergedCell = excelRow.getCell(colIndex + c);
                            mergedCell.border = excelCell.border;
                        }
                    }
                    colIndex += colspan;
                });
            });

            // 5. Add total days row
            const totalDays = document.getElementById('report-total-days').innerText || '0';
            const footerRow = ws.addRow([]);
            footerRow.getCell(1).value = '%,E'DJ 9// 'DJHEJ'*:';
            footerRow.getCell(1).font = { bold: true };
            footerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            
            footerRow.getCell(5).value = Number(totalDays);
            footerRow.getCell(5).font = { bold: true, color: { argb: 'FF217346' } };
            footerRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
            
            for(let i=1; i<=9; i++) {
                footerRow.getCell(i).border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            }
            ws.mergeCells(footerRow.number, 1, footerRow.number, 4);
            ws.mergeCells(footerRow.number, 5, footerRow.number, 9);

            // 6. Generate and Download
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const today = new Date().toISOString().split('T')[0];
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `labor_report_${today}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 7. Also download full system backup (.json) automatically
            try {
                const exportRes = await fetch('/api/export');
                if (exportRes.ok) {
                    const exportData = await exportRes.text();
                    const jsonBlob = new Blob([exportData], { type: 'application/json' });
                    const jsonLink = document.createElement('a');
                    jsonLink.href = URL.createObjectURL(jsonBlob);
                    jsonLink.download = `system_backup_${today}.json`;
                    document.body.appendChild(jsonLink);
                    jsonLink.click();
                    document.body.removeChild(jsonLink);
                }
            } catch (jsonErr) {
                console.error("Failed to download JSON backup:", jsonErr);
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (e) {
            console.error(e);
            alert('-/+ .7# #+F'! *5/J1 'D%C3JD.');
            const btn = document.querySelector('button[onclick="app.exportStyledExcel()"]');
            if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-excel"></i> %C3JD <i class="fas fa-download"></i>'; }
        }
    }

    async init() {
        await auth.init();
        
        // Setup current date badge
        const today = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
        const dateBadge = document.getElementById('current-date-badge');
        if(dateBadge) dateBadge.innerText = today;
        
        const dateInput = document.getElementById('record-date');
        if(dateInput) dateInput.value = today;

        this.attachEventListeners();
        
        if (auth.isLoggedIn()) {
            this.setupWorkspace();
        } else {
            const params = new URLSearchParams(window.location.search);
            const inviteId = params.get('invite');
            if (inviteId) {
                this.setupInvite(inviteId);
            } else {
                UI.showView('view-login');
            }
        }
    }

    attachEventListeners() {
        // Profile Picture Upload
        const profilePicContainer = document.getElementById('profile-pic-container');
        const profilePicInput = document.getElementById('profile-pic-input');
        if (profilePicContainer && profilePicInput) {
            profilePicContainer.addEventListener('click', () => {
                profilePicInput.click();
            });
            profilePicInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const img = new Image();
                        img.onload = async () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 150;
                            const MAX_HEIGHT = 150;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            try {
                                const base64Str = canvas.toDataURL('image/jpeg', 0.7);
                                auth.currentUser.profilePic = base64Str;
                                await db.update('users', auth.currentUser.id, auth.currentUser);
                                localStorage.setItem('labor_app_user', JSON.stringify(auth.currentUser));
                                
                                document.getElementById('current-profile-pic').src = base64Str;
                                document.getElementById('current-profile-pic').style.display = 'block';
                                document.getElementById('default-profile-icon').style.display = 'none';
                            } catch(err) {
                                console.error(err);
                                alert('-/+ .7# #+F'! -A8 'D5H1): ' + err.message);
                            }
                        };
                        img.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Invite Form
        document.getElementById('invite-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('invite-password').value;
            const userId = document.getElementById('invite-user-id').value;
            
            try {
                const user = await db.getById('users', userId);
                user.password = newPass;
                await db.update('users', userId, user);
                alert('*E *9JJF CDE) 'DE1H1 (F,'-! ,'1J *3,JD 'D/.HD...');
                
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (await auth.login(user.username, newPass)) {
                    this.setupWorkspace();
                }
            } catch (err) {
                alert('-/+ .7# #+F'! *9JJF CDE) 'DE1H1');
            }
        });

        // Login Form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            try {
                if (await auth.login(user, pass)) {
                    this.setupWorkspace();
                } else {
                    alert(''3E 'DE3*./E #H CDE) 'DE1H1 :J1 5-J-)');
                }
            } catch (err) {
                console.error(err);
                alert("-/+ .7# #+F'! *3,JD 'D/.HD: " + err.message);
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.logout();
        });

        // Broadcast Form & Multiselect logic
        const multiselectHeader = document.querySelector('#broadcast-multiselect .multiselect-header');
        const multiselectDropdown = document.querySelector('#broadcast-multiselect .multiselect-dropdown');
        const multiselectIcon = document.getElementById('multiselect-icon');
        
        if (multiselectHeader && multiselectDropdown) {
            multiselectHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = multiselectDropdown.style.display === 'block';
                multiselectDropdown.style.display = isVisible ? 'none' : 'block';
                multiselectHeader.style.borderColor = isVisible ? 'var(--border-color)' : 'var(--primary-color)';
                if (multiselectIcon) multiselectIcon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
            });
            document.addEventListener('click', (e) => {
                const multiselect = document.getElementById('broadcast-multiselect');
                if (multiselect && !multiselect.contains(e.target)) {
                    multiselectDropdown.style.display = 'none';
                    multiselectHeader.style.borderColor = 'var(--border-color)';
                    if (multiselectIcon) multiselectIcon.style.transform = 'rotate(0deg)';
                }
            });
        }

        const allCheckbox = document.getElementById('broadcast-target-all');
        const broadcastUserList = document.getElementById('broadcast-user-list');
        const updateMultiselectTitle = () => {
            const titleSpan = document.getElementById('multiselect-title');
            if (!titleSpan) return;
            const total = document.querySelectorAll('.broadcast-user-checkbox').length;
            const checked = document.querySelectorAll('.broadcast-user-checkbox:checked').length;
            if (checked === total) {
                titleSpan.innerText = ",EJ9 'DE3*./EJF";
            } else if (checked === 0) {
                titleSpan.innerText = "DE J*E *-/J/ #-/";
            } else {
                titleSpan.innerText = `*E *-/J/ (${checked}) E3*./EJF`;
            }
        };
        
        if (allCheckbox) {
            allCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.broadcast-user-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                updateMultiselectTitle();
            });
        }
        if (broadcastUserList) {
            broadcastUserList.addEventListener('change', (e) => {
                if (e.target.classList.contains('broadcast-user-checkbox')) {
                    const total = document.querySelectorAll('.broadcast-user-checkbox').length;
                    const checked = document.querySelectorAll('.broadcast-user-checkbox:checked').length;
                    if(allCheckbox) allCheckbox.checked = (total === checked);
                    updateMultiselectTitle();
                }
            });
        }

        const broadcastForm = document.getElementById('broadcast-form');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('broadcast-submit-btn');
                const origText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ,'1J 'D%13'D...';
                btn.disabled = true;
                
                try {
                    const title = document.getElementById('broadcast-title').value;
                    const message = document.getElementById('broadcast-message').value;
                    
                    let target = "all";
                    const allCheckbox = document.getElementById('broadcast-target-all');
                    if (allCheckbox && !allCheckbox.checked) {
                        const checked = Array.from(document.querySelectorAll('.broadcast-user-checkbox:checked')).map(cb => cb.value);
                        if (checked.length === 0) {
                            alert(''D1,'! '.*J'1 E3*./E H'-/ 9DI 'D#BD');
                            btn.innerHTML = origText;
                            btn.disabled = false;
                            return;
                        }
                        target = checked;
                    }
                    
                    const res = await fetch('/api/broadcast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, message, target })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        alert(`*E %13'D 'D%49'1 (F,'- %DI ${data.sent} ,G'2/E3*./E.`);
                        broadcastForm.reset();
                    } else {
                        let errText = await res.text();
                        try { errText = JSON.parse(errText).error || errText; } catch(e) {}
                        alert('-/+ .7# '+F'! 'D'13'D: ' + (errText || res.status));
                    }
                } catch (err) {
                    console.error(err);
                    alert('.7# AJ 'D'*5'D ('D.'/E: ' + err.message);
                }
                
                btn.innerHTML = origText;
                btn.disabled = false;
            });
        }

        // Import System Data
        const importInput = document.getElementById('import-file-input');
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (confirm('*-0J1: '3*9'/) 'DF8'E EF EDA .'1,J 3J$/J %DI 'DC*'() AHB ,EJ9 'D(J'F'* 'D-'DJ). GD #F* E*#C/ EF 'DE*'(9)')) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            const res = await fetch('/api/import', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            if (res.ok) {
                                alert('*E '3*9'/) 'DF8'E (F,'-! 3J*E %9'/) *-/J+ 'D5A-).');
                                window.location.reload();
                            } else {
                                alert('A4D AJ '3*9'/) 'DF8'E.');
                            }
                        } catch (err) {
                            console.error(err);
                            alert('EDA :J1 5'D-.');
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }

        // Admin: Add User
        document.getElementById('add-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('new-username').value;
            const pass = document.getElementById('new-password').value;
            const role = document.getElementById('new-role').value;
            
            try {
                await db.add('users', { username: user, password: pass, role: role });
                document.getElementById('add-user-form').reset();
                this.loadAdminData();
                alert('*E %6'A) 'DE3*./E (F,'-');
            } catch (err) {
                alert(''3E 'DE3*./E EH,H/ ('DA9D #H -/+ .7#');
            }
        });
        
        // Admin: Add Dir Worker
        document.getElementById('add-dir-worker-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('dir-worker-name').value.trim();
            const type = document.getElementById('dir-worker-type').value;
            const amount = document.getElementById('dir-worker-amount').value;
            
            try {
                // Check for duplicates
                const existingWorkers = await db.getAll('worker_directory');
                const isDuplicate = existingWorkers.some(w => w.name === name);
                
                if (isDuplicate) {
                    alert('9AH'K '3E 'D9'ED E3,D ('DA9D AJ B'9/) 'D9E'D. D' JECF %6'A) FA3 'D'3E E1*JF.');
                    return;
                }

                await db.add('worker_directory', { name, type, defaultAmount: amount });
                document.getElementById('add-dir-worker-form').reset();
                this.loadAdminData();
                alert('*E %6'A) 'D9'ED DB'9/) 'D(J'F'* (F,'-');
            } catch (err) {
                alert('-/+ .7#');
            }
        });
        
        // Supervisor: Add Worker Row
        document.getElementById('add-worker-btn').addEventListener('click', () => {
            this.addWorkerRow();
        });
        
        // Supervisor: Submit Record
        document.getElementById('record-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalHtml = submitBtn.innerHTML;
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ,'1J 'D%13'D...';
                await this.submitRecord();
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
            }
        });

        // Engineer: Modal Close
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.getElementById('record-modal').classList.add('hidden');
        });
        
        // Reports: Filter
        document.getElementById('filter-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateReport();
        });
        
        // Reports: Clear Filter
        document.getElementById('clear-filter-btn').addEventListener('click', () => {
            document.getElementById('filter-form').reset();
            this.generateReport();
        });
        
        // Reports: Print
        document.getElementById('print-report-btn').addEventListener('click', () => {
            window.print();
        });
    }

    async setupWorkspace() {
        const role = auth.getRole();
        document.getElementById('current-username').innerText = (auth.currentUser.username === 'admin' ? 'Bishoy Mamdouh' : auth.currentUser.username);
        document.getElementById('current-role').innerText = auth.getRoleNameAr(role);
        
        if (auth.currentUser.profilePic) {
            document.getElementById('current-profile-pic').src = auth.currentUser.profilePic;
            document.getElementById('current-profile-pic').style.display = 'block';
            document.getElementById('default-profile-icon').style.display = 'none';
        } else {
            document.getElementById('current-profile-pic').style.display = 'none';
            document.getElementById('default-profile-icon').style.display = 'block';
        }
        
        UI.updateNavigation(role);
        this.startNotificationPoller();
        
        if (role === 'admin') {
            this.loadAdminData();
            this.loadEngineerData();
            this.generateReport();
            
            await UI.renderEngineerOptions();
            let dirWorkers = await db.getAll('worker_directory');
            dirWorkers.sort((a, b) => customSort(a, b, false));
            this.directoryWorkers = dirWorkers;
            this.loadSupervisorData();
            this.currentWorkers = [];
            document.getElementById('workers-list').innerHTML = '';
            this.addWorkerRow();
            this.updateTotals();
        } else if (role === 'engineer') {
            this.loadEngineerData();
            this.generateReport();
            
            await UI.renderEngineerOptions();
            let dirWorkers = await db.getAll('worker_directory');
            dirWorkers.sort((a, b) => customSort(a, b, false));
            this.directoryWorkers = dirWorkers;
            this.loadSupervisorData();
            this.currentWorkers = [];
            document.getElementById('workers-list').innerHTML = '';
            this.addWorkerRow();
            this.updateTotals();
        } else if (role === 'supervisor' || role === 'surveyor' || role === 'warehouse_manager' || role === 'operator_supervisor') {
            await UI.renderEngineerOptions();
            let dirWorkers = await db.getAll('worker_directory');
            dirWorkers.sort((a, b) => customSort(a, b, false));
            this.directoryWorkers = dirWorkers;
            this.loadSupervisorData();
            // Add first empty worker row
            this.currentWorkers = [];
            document.getElementById('workers-list').innerHTML = '';
            this.addWorkerRow();
            this.updateTotals();
        }
    }

    // --- Admin Functions ---
    async loadAdminData() {
        let users = await db.getAll('users');
        users.sort((a, b) => customSort(a, b, true));
        UI.renderUsersTable(users, auth.currentUser.id);
        
        let dirWorkers = await db.getAll('worker_directory');
        dirWorkers.sort((a, b) => customSort(a, b, false));
        UI.renderDirWorkersTable(dirWorkers);
    }

    async deleteUser(id) {
        if (confirm('GD #F* E*#C/ EF -0A G0' 'DE3*./E')) {
            await db.delete('users', id);
            this.loadAdminData();
        }
    }

    async setupInvite(inviteId) {
        try {
            const user = await db.getById('users', inviteId);
            if (user) {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('invite-form').classList.remove('hidden');
                document.getElementById('invite-username-display').innerText = user.username === 'admin' ? 'Bishoy Mamdouh' : user.username;
                document.getElementById('invite-user-id').value = user.id;
                UI.showView('view-login');
            } else {
                alert('1'(7 'D/9H) :J1 5'D- #H EF*GJ.');
                UI.showView('view-login');
            }
        } catch (e) {
            UI.showView('view-login');
        }
    }

    copyInviteLink(userId) {
        const link = window.location.origin + window.location.pathname + '?invite=' + userId;
        navigator.clipboard.writeText(link).then(() => {
            alert('*E F3. 1'(7 'D/.HD (F,'-!\nJECFC 'D"F %13'DG DDE41A DJ9JF CDE) 'DE1H1 'D.'5) (G.');
        }).catch(err => {
            alert('A4D 'DF3. *DB'&J'K. 'F3. 'D1'(7 'D*'DJ:\n' + link);
        });
    }

    async editUser(id) {
        const row = document.getElementById(`user-row-${id}`);
        if (!row) return;
        const nameCell = row.querySelector('.user-col-name');
        const passCell = row.querySelector('.user-col-pass');
        const roleCell = row.querySelector('.user-col-role');
        const actionsCell = row.querySelector('.user-col-actions');
        
        const currentName = nameCell.innerText;
        const currentPass = passCell.getAttribute('data-pass');
        const currentRole = roleCell.querySelector('span').getAttribute('data-role');
        
        nameCell.innerHTML = `<input type="text" id="edit-user-name-${id}" value="${currentName}" style="width:100%; padding: 5px;">`;
        passCell.innerHTML = `<input type="text" id="edit-user-pass-${id}" value="${currentPass}" placeholder="('3H1/ ,/J/" style="width:100%; padding: 5px;">`;
        roleCell.innerHTML = `
            <select id="edit-user-role-${id}" style="width:100%; padding: 5px;">
                <option value="supervisor" ${currentRole==='supervisor'?'selected':''}>E41A</option>
                <option value="surveyor" ${currentRole==='surveyor'?'selected':''}>E3'-</option>
                <option value="warehouse_manager" ${currentRole==='warehouse_manager'?'selected':''}>E/J1 E.2F</option>
                <option value="operator_supervisor" ${currentRole==='operator_supervisor'?'selected':''}>E41A E4:D</option>
                <option value="engineer" ${currentRole==='engineer'?'selected':''}>EGF/3</option>
                <option value="admin" ${currentRole==='admin'?'selected':''}>E/J1</option>
            </select>
        `;
        
        actionsCell.innerHTML = `
            <button class="btn-icon text-success" onclick="app.saveUser('${id}')" title="-A8"><i class="fas fa-save"></i></button>
            <button class="btn-icon text-danger" onclick="app.loadAdminData()" title="%D:'!"><i class="fas fa-times"></i></button>
        `;
    }

    async saveUser(id) {
        const newName = document.getElementById(`edit-user-name-${id}`).value.trim();
        const newPass = document.getElementById(`edit-user-pass-${id}`).value;
        const newRole = document.getElementById(`edit-user-role-${id}`).value;
        
        if (!newName) {
            alert('J1,I C*'() '3E 'DE3*./E');
            return;
        }

        const user = await db.getById('users', id);
        if (user) {
            user.username = newName;
            user.role = newRole;
            if (newPass) {
                user.password = newPass;
            }
            await db.update('users', id, user);
            this.loadAdminData();
            alert('*E 'D*9/JD (F,'-');
        }
    }

    async deleteDirWorker(id) {
        if (confirm('GD #F* E*#C/ EF -0A G0' 'D9'ED EF 'DB'9/)')) {
            await db.delete('worker_directory', id);
            this.loadAdminData();
        }
    }

    async editDirWorker(id) {
        const row = document.getElementById(`dir-worker-row-${id}`);
        if (!row) return;
        const nameCell = row.querySelector('.dir-col-name');
        const typeCell = row.querySelector('.dir-col-type');
        const amountCell = row.querySelector('.dir-col-amount');
        const actionsCell = row.querySelector('.dir-col-actions');
        
        const currentName = nameCell.innerText;
        const currentType = typeCell.innerText;
        const currentAmount = amountCell.innerText;
        
        nameCell.innerHTML = `<input type="text" id="edit-dir-name-${id}" value="${currentName}" style="width:100%; padding: 5px;">`;
        typeCell.innerHTML = `
            <select id="edit-dir-type-${id}" style="width:100%; padding: 5px;">
                <option value="9'ED" ${currentType==='9'ED'?'selected':''}>9'ED</option>
                <option value="F-'*" ${currentType==='F-'*'?'selected':''}>F-'*</option>
                <option value="5F'J9I" ${currentType==='5F'J9I'?'selected':''}>5F'J9I</option>
                <option value="E41A 9E'D" ${currentType==='E41A 9E'D'?'selected':''}>E41A 9E'D</option>
                <option value="(HAJG" ${currentType==='(HAJG'?'selected':''}>(HAJG</option>
                <option value="'.1I" ${currentType===''.1I'?'selected':''}>'.1I</option>
            </select>
        `;
        amountCell.innerHTML = `<input type="number" id="edit-dir-amount-${id}" value="${currentAmount}" style="width: 80px; padding: 5px;">`;
        
        actionsCell.innerHTML = `
            <button class="btn-icon text-success" onclick="app.saveDirWorker('${id}')" title="-A8"><i class="fas fa-save"></i></button>
            <button class="btn-icon text-danger" onclick="app.loadAdminData()" title="%D:'!"><i class="fas fa-times"></i></button>
        `;
    }

    async saveDirWorker(id) {
        const newName = document.getElementById(`edit-dir-name-${id}`).value.trim();
        const newType = document.getElementById(`edit-dir-type-${id}`).value;
        const newAmount = document.getElementById(`edit-dir-amount-${id}`).value;
        
        if (!newName || !newAmount) {
            alert('J1,I *9(&) ,EJ9 'D-BHD');
            return;
        }

        const worker = await db.getById('worker_directory', id);
        if (worker) {
            worker.name = newName;
            worker.type = newType;
            worker.defaultAmount = newAmount;
            await db.update('worker_directory', id, worker);
            this.loadAdminData();
        }
    }

    // --- Supervisor Functions ---
    async loadSupervisorData() {
        const records = await db.getRecordsWithDetails(null, auth.currentUser.id, null, null);
        UI.renderSupervisorRecords(records);
    }
    
    addWorkerRow() {
        const workerId = Date.now() + Math.floor(Math.random() * 1000);
        this.currentWorkers.push(workerId);
        
        let optionsHtml = '<option value="" disabled selected>'.*1 'D9'ED</option>';
        this.directoryWorkers.forEach(w => {
            optionsHtml += `<option value="${w.id}">${w.name}</option>`;
        });
        
        const tbody = document.getElementById('workers-list');
        const tr = document.createElement('tr');
        tr.id = `worker-row-${workerId}`;
        
        tr.innerHTML = `
            <td>
                <select id="worker-name-${workerId}" required onchange="app.onWorkerSelectChange(${workerId})">
                    ${optionsHtml}
                </select>
            </td>
            <td>
                <select id="worker-type-${workerId}" required onchange="app.onWorkerTypeChange(${workerId})">
                    <option value="" disabled selected>'DFH9</option>
                    <option value="9'ED">9'ED</option>
                    <option value="F-'*">F-'*</option>
                    <option value="5F'J9I">5F'J9I</option>
                    <option value="E41A 9E'D">E41A 9E'D</option>
                    <option value="(HAJG">(HAJG</option>
                    <option value="'.1I">'.1I</option>
                </select>
            </td>
            <td>
                <input type="number" id="worker-amount-${workerId}" required min="0" readonly placeholder="'DJHEJ)">
            </td>
            <td>
                <input type="text" id="worker-location-${workerId}" placeholder="EC'F 'D9ED">
            </td>
            <td>
                <input type="text" id="worker-notes-${workerId}" placeholder="ED'-8'*">
            </td>
            <td>
                <button type="button" class="btn-icon text-danger" onclick="app.removeWorkerRow(${workerId})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tbody.appendChild(tr);
    }
    
    onWorkerSelectChange(id) {
        const select = document.getElementById(`worker-name-${id}`);
        const selectedWorkerId = select.value;
        const worker = this.directoryWorkers.find(w => w.id === selectedWorkerId);
        
        if (worker) {
            document.getElementById(`worker-type-${id}`).value = worker.type;
            document.getElementById(`worker-amount-${id}`).value = worker.defaultAmount;
            this.updateTotals();
        }
    }

    onWorkerTypeChange(id) {
        const typeSelect = document.getElementById(`worker-type-${id}`);
        const amountInput = document.getElementById(`worker-amount-${id}`);
        const selectName = document.getElementById(`worker-name-${id}`);
        
        const selectedType = typeSelect.value;
        const selectedWorkerId = selectName.value;
        
        const worker = this.directoryWorkers.find(w => w.id === selectedWorkerId);
        
        if (worker && selectedType === worker.type) {
            // If the supervisor selects the worker's native type, restore their custom native rate
            amountInput.value = worker.defaultAmount;
            this.updateTotals();
            return;
        }
        
        const rates = {
            '9'ED': 350,
            'F-'*': 400,
            '5F'J9J': 550,
            '(HAJG': 350,
            '#.1I': 350
        };
        
        if (rates[selectedType] !== undefined) {
            amountInput.value = rates[selectedType];
            this.updateTotals();
        }
    }
    
    removeWorkerRow(id) {
        this.currentWorkers = this.currentWorkers.filter(wId => wId !== id);
        const row = document.getElementById(`worker-row-${id}`);
        if (row) row.remove();
        this.updateTotals();
    }
    
    updateTotals() {
        let total = 0;
        let count = 0;
        
        this.currentWorkers.forEach(id => {
            const nameInput = document.getElementById(`worker-name-${id}`);
            const amountInput = document.getElementById(`worker-amount-${id}`);
            
            if (nameInput && nameInput.value.trim() !== '') {
                count++;
            }
            if (amountInput && amountInput.value) {
                total += Number(amountInput.value);
            }
        });
        
        document.getElementById('total-workers-count').innerText = count;
        document.getElementById('total-amount').innerText = total.toLocaleString();
    }
    
    async submitRecord() {
        const date = document.getElementById('record-date').value;
        let engineerId = document.getElementById('record-engineer').value;
        const role = auth.getRole();
        
        if (role === 'engineer' || role === 'admin') {
            engineerId = auth.currentUser.id;
        } else if (!engineerId) {
            alert(''D1,'! '.*J'1 'DEGF/3 'DE3$HD');
            return;
        }
        
        let workersData = [];
        let totalAmount = 0;
        let validWorkersCount = 0;
        
        for (let id of this.currentWorkers) {
            const selectEl = document.getElementById(`worker-name-${id}`);
            const selectedWorkerId = selectEl.value;
            if (!selectedWorkerId) continue;
            
            const workerObj = this.directoryWorkers.find(w => w.id === selectedWorkerId);
            const name = workerObj ? workerObj.name : selectEl.options[selectEl.selectedIndex].text;
            const type = document.getElementById(`worker-type-${id}`).value;
            const amount = Number(document.getElementById(`worker-amount-${id}`).value);
            const location = document.getElementById(`worker-location-${id}`).value;
            const notes = document.getElementById(`worker-notes-${id}`).value || '';
            
            if (name && amount >= 0) {
                workersData.push({ name, type, amount, location, deduction: 0, notes: notes });
                totalAmount += amount;
                validWorkersCount++;
            }
        }
        
        if (validWorkersCount === 0) {
            alert(''D1,'! %/.'D (J'F'* 9'ED H'-/ 9DI 'D#BD');
            return;
        }

        // --- Duplicate Checking Logic ---
        const namesInForm = new Set();
        for (let w of workersData) {
            const normalizedName = w.name.trim();
            if (namesInForm.has(normalizedName)) {
                alert(`.7#: DB/ BE* (%/.'D '3E 'D9'ED "${w.name}" #C+1 EF E1) AJ FA3 'D31CJ! J1,I -0A 'D*C1'1.`);
                return;
            }
            namesInForm.add(normalizedName);
        }

        // Fetch all records for the same date
        const allRecords = await db.getAll('records');
        const todaysRecords = allRecords.filter(r => r.date === date);
        const todaysRecordIds = todaysRecords.map(r => r.id);
        
        if (todaysRecordIds.length > 0) {
            const allWorkers = await db.getAll('workers');
            const todaysWorkers = allWorkers.filter(w => todaysRecordIds.includes(w.recordId) && !w.isDeleted);
            
            const users = await db.getAll('users');
            
            for (let newWorker of workersData) {
                const duplicate = todaysWorkers.find(tw => tw.name.trim() === newWorker.name.trim());
                if (duplicate) {
                    const dupRecord = todaysRecords.find(r => r.id === duplicate.recordId);
                    const supervisor = users.find(u => u.id === dupRecord.supervisorId);
                    const supervisorName = supervisor ? supervisor.username : 'E41A ".1';
                    alert(`9AH'K D' JECF %13'D 'D31CJ. 'D9'ED "${newWorker.name}" E3,D 'DJHE ('DA9D (H'37) 'DE41A "${supervisorName}".`);
                    return; // Stop submission
                }
            }
        }
        // --------------------------------
        
        try {
            // Create Record
            const recordId = await db.add('records', {
                date: date,
                supervisorId: auth.currentUser.id,
                engineerId: engineerId,
                status: (role === 'engineer' || role === 'admin') ? 'approved' : 'pending',
                totalWorkers: validWorkersCount,
                totalAmount: totalAmount,
                createdAt: new Date().toISOString()
            });
            
            // Add Workers linked to record
            for (let worker of workersData) {
                await db.add('workers', {
                    recordId: recordId,
                    name: worker.name,
                    type: worker.type,
                    amount: worker.amount,
                    location: worker.location,
                    deduction: worker.deduction,
                    notes: worker.notes
                });
            }
            
            if (role === 'engineer' || role === 'admin') {
                alert('*E *3,JD 'D31CJ H'9*E'/G (F,'-');
            } else {
                alert('*E %13'D 'D31CJ DD'9*E'/ (F,'-');
            }
            
            // Reset Form
            document.getElementById('record-form').reset();
            document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('workers-list').innerHTML = '';
            this.currentWorkers = [];
            this.addWorkerRow();
            this.updateTotals();
            
            // Reload list
            this.loadSupervisorData();
            
        } catch (error) {
            console.error(error);
            alert('-/+ .7# #+F'! -A8 'D(J'F'*');
        }
    }

    async deleteRecord(recordId) {
        if (!confirm('GD #F* E*#C/ EF E3- G0' 'D31CJ')) return;
        
        try {
            // Delete record
            await db.delete('records', recordId);
            
            // Delete associated workers
            const workers = await db.getByField('workers', 'recordId', recordId);
            for (let w of workers) {
                await db.delete('workers', w.id);
            }
            
            alert('*E E3- 'D31CJ (F,'-');
            this.loadSupervisorData();
            
            const role = auth.getRole();
            if (role === 'admin') {
                this.loadAdminData();
                this.loadEngineerData();
                this.generateReport();
            } else if (role === 'engineer') {
                this.loadEngineerData();
                this.generateReport();
            }
        } catch (error) {
            console.error(error);
            alert('-/+ .7# #+F'! 'DE3-');
        }
    }

    // --- Engineer Functions ---
    async deleteAllEngineerRecords() {
        const role = auth.getRole();
        const engineerId = role === 'admin' ? null : auth.currentUser.id;
        
        let filterStatus = null;
        const filterSelect = document.getElementById('engineer-status-filter');
        if (filterSelect && filterSelect.value !== 'all') {
            filterStatus = filterSelect.value;
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, null);
        
        if (records.length === 0) {
            alert('D' JH,/ 31'CJ D-0AG'.');
            return;
        }

        if (!confirm(`GD #F* E*#C/ EF -0A ${records.length} 31CJ FG'&J'K G0' 'D%,1'! D' JECF 'D*1',9 9FG.`)) return;

        try {
            for (let record of records) {
                // Delete record
                await db.delete('records', record.id);
                // Delete associated workers
                const workers = await db.getByField('workers', 'recordId', record.id);
                for (let w of workers) {
                    await db.delete('workers', w.id);
                }
            }
            alert('*E -0A ,EJ9 'D31'CJ 'DE-//) (F,'-.');
            this.loadEngineerData();
        } catch (error) {
            console.error(error);
            alert('-/+ .7# #+F'! 'D-0A.');
        }
    }

    async loadEngineerData() {
        const role = auth.getRole();
        const engineerId = role === 'admin' ? null : auth.currentUser.id;
        
        let filterStatus = null;
        const filterSelect = document.getElementById('engineer-status-filter');
        if (filterSelect && filterSelect.value !== 'all') {
            filterStatus = filterSelect.value;
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, null);
        UI.renderEngineerRecords(records, role);
    }
    
    async viewRecordDetails(recordId, readOnly = false) {
        try {
            const res = await db.request(`/api/recordDetails?id=${recordId}`);
            const data = await res.json();
            
            const record = data.record;
            const users = data.users;
            const workers = data.workers;
            
            const supervisor = users.find(u => u.id === record.supervisorId);
            record.supervisorName = supervisor ? supervisor.username : ':J1 E91HA';
            
            await UI.renderRecordDetailsModal(record, workers, readOnly);
        } catch (e) {
            console.error(e);
            alert("-/+ .7# #+F'! A*- 'D*A'5JD: " + e.message);
        }
    }
    
    onModalTypeChange(id, name) {
        let prefix = window.currentCardPrefix || 'card';
        const typeSelect = document.getElementById(`${prefix}-type-${id}`);
        const amountInput = document.getElementById(`${prefix}-amount-${id}`);
        const selectedType = typeSelect.value;
        
        const worker = this.directoryWorkers.find(w => w.name === name);
        if (worker && selectedType === worker.type) {
            amountInput.value = worker.defaultAmount;
            return;
        }
        
        const rates = {
            '9'ED': 350,
            'F-'*': 400,
            '5F'J9J': 550,
            '(HAJG': 350,
            '#.1I': 350
        };
        
        if (rates[selectedType] !== undefined) {
            amountInput.value = rates[selectedType];
        }
    }
    
    async removeWorkerFromRecord(recordId, workerId) {
        if (!confirm('GD #F* E*#C/ EF -0A G0' 'D9'ED EF 'D31CJ')) return;
        
        try {
            const worker = await db.getById('workers', workerId);
            if (worker) {
                worker.isDeleted = true;
                await db.update('workers', workerId, worker);
            }
            
            // Fetch updated workers to recalculate record totals
            const workersRes = await fetch('/api/allRecordsDetails?t=' + Date.now(), {cache: 'no-store'});
            const allRecs = await workersRes.json();
            const currentRec = allRecs.find(r => String(r.id) === String(recordId));
            const workers = currentRec ? currentRec.workers : [];
            
            let newTotalAmount = 0;
            let activeWorkersCount = 0;
            for (let w of workers) {
                if (w.isDeleted) continue;
                const netAmount = (Number(w.amount) || 0) - (Number(w.deduction) || 0);
                newTotalAmount += netAmount > 0 ? netAmount : 0;
                activeWorkersCount++;
            }
            
            const record = await db.getById('records', recordId);
            if(record) {
                record.totalAmount = newTotalAmount;
                record.totalWorkers = activeWorkersCount;
                await db.update('records', recordId, record);
            }
            
            // Re-render UI
            const role = auth.getRole();
            if (role === 'admin') {
                await this.loadAdminData();
                await this.loadEngineerData();
                await this.generateReport();
            } else if (role === 'engineer') {
                await this.loadEngineerData();
                await this.generateReport();
            }
            
            const modal = document.getElementById('record-modal');
            if (!modal.classList.contains('hidden')) {
                this.viewRecordDetails(recordId, role === 'supervisor');
            }
            
        } catch (e) {
            console.error(e);
            alert('-/+ .7# #+F'! 'D-0A');
        }
    }

    async updateRecordStatus(recordId, status) {
        const record = await db.getById('records', recordId);
        if (record) {
            let prefix = window.currentCardPrefix || 'card';
            if (status === 'approved') {
                let newTotalAmount = 0;
                let prefix = window.currentCardPrefix || 'card';
                // Fetch actual workers from DB to be safe
                const workersRes = await fetch('/api/allRecordsDetails?t=' + Date.now(), {cache: 'no-store'});
                const allRecs = await workersRes.json();
                const currentRec = allRecs.find(r => String(r.id) === String(recordId));
                const workers = currentRec ? currentRec.workers : [];

                let updatePromises = [];
                for (let worker of workers) {
                    const typeInput = document.getElementById(`${prefix}-type-${worker.id}`);
                    const amountInput = document.getElementById(`${prefix}-amount-${worker.id}`);
                    const locationInput = document.getElementById(`${prefix}-location-${worker.id}`);
                    const deductionInput = document.getElementById(`${prefix}-deduction-${worker.id}`);
                    const notesInput = document.getElementById(`${prefix}-notes-${worker.id}`);
                    
                    if (typeInput && amountInput) {
                        worker.type = typeInput.value;
                        worker.amount = Number(amountInput.value);
                        worker.location = locationInput ? locationInput.value : (worker.location || '');
                        worker.deduction = deductionInput ? Number(deductionInput.value) : 0;
                        worker.notes = notesInput ? notesInput.value : (worker.notes || '');
                        
                        updatePromises.push(db.update('workers', worker.id, worker));
                    }
                    
                    // Calculate total
                    const netAmount = (Number(worker.amount) || 0) - (Number(worker.deduction) || 0);
                    newTotalAmount += netAmount > 0 ? netAmount : 0;
                }
                await Promise.all(updatePromises);
                record.totalAmount = newTotalAmount;
            }
            
            record.status = status;
            await db.update('records', recordId, record); 
            document.getElementById('record-modal').classList.add('hidden');
            
            const role = auth.getRole();
            if (role === 'admin') {
                await this.loadAdminData();
                await this.loadEngineerData();
                await this.generateReport();
            } else if (role === 'engineer') {
                await this.loadEngineerData();
                await this.generateReport();
            }
            
            alert(`*E ${status === 'approved' ? ''9*E'/' : '1A6'} 'D31CJ (F,'-`);
        }
    // --- Reports Functions ---
    async generateReport() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const workerName = document.getElementById('filter-worker-name').value.trim().toLowerCase();
        
        if (startDate && endDate) {
            document.getElementById('print-date-range').innerText = `'DA*1) EF ${startDate} %DI ${endDate}`;
        } else {
            document.getElementById('print-date-range').innerText = `,EJ9 'D3,D'* EF (/'J) 'D9ED`;
        }
        
        // 1. Get all approved records
        let records = await db.getAll('records');
        records = records.filter(r => r.status === 'approved');
        
        // If Engineer, only show their records
        if (auth.getRole() === 'engineer') {
            records = records.filter(r => String(r.engineerId) === String(auth.currentUser.id));
        }
        
        // Filter by date if provided
        if (startDate && endDate) {
            records = records.filter(r => r.date >= startDate && r.date <= endDate);
        }
        
        const validRecordIds = records.map(r => r.id);
        const recordsMap = records.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
        
        // 2. Get users map
        const users = await db.getAll('users');
        const usersMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
        
        // 3. Get all workers and filter
        let allWorkers = await db.getAll('workers');
        
        let filteredWorkers = allWorkers.filter(w => validRecordIds.includes(w.recordId) && !w.isDeleted);
        
        if (workerName) {
            filteredWorkers = filteredWorkers.filter(w => w.name.toLowerCase().includes(workerName));
        }
        
        // Sort workers: Supervisor name (ascending), then Date (descending)
        filteredWorkers.sort((a, b) => {
            const recordA = recordsMap[a.recordId];
            const recordB = recordsMap[b.recordId];
            
            const dateA = recordA.date || '';
            const dateB = recordB.date || '';
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            
            const supervisorA = (usersMap[recordA.supervisorId] ? usersMap[recordA.supervisorId].username : '').toLowerCase();
            const supervisorB = (usersMap[recordB.supervisorId] ? usersMap[recordB.supervisorId].username : '').toLowerCase();
            
            if (supervisorA < supervisorB) return -1;
            if (supervisorA > supervisorB) return 1;
            
            return 0;
        });
        
        UI.renderReportResults(filteredWorkers, recordsMap, usersMap);
    }
    
    // --- Notification System ---
    startNotificationPoller() {
        if (Notification.permission === "granted") {
            this.subscribeUserToPush();
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(p => {
                if (p === "granted") this.subscribeUserToPush();
            });
        }
        
        const role = auth.getRole();
        if (role !== 'admin' && role !== 'engineer') {
            if (this.notifInterval) clearInterval(this.notifInterval);
            return;
        }
        

        
        this.lastPendingCount = 0;
        
        const check = async () => {
            try {
                const engineerId = role === 'admin' ? null : auth.currentUser?.id;
                const records = await db.getRecordsWithDetails('pending', null, engineerId, null);
                const currentCount = records.length;
                
                const badge = document.getElementById('nav-badge-engineer');
                if (badge) {
                    if (currentCount > 0) {
                        badge.style.display = 'inline-block';
                        badge.innerText = currentCount;
                        if ('setAppBadge' in navigator) {
                            navigator.setAppBadge(currentCount).catch(console.error);
                        }
                    } else {
                        badge.style.display = 'none';
                        if ('clearAppBadge' in navigator) {
                            navigator.clearAppBadge().catch(console.error);
                        }
                    }
                }
                
                if (currentCount > this.lastPendingCount && this.lastPendingCount !== -1) {
                    if (document.getElementById('view-engineer').classList.contains('active')) {
                        this.loadEngineerData().catch(e => console.error('Error reloading engineer data:', e));
                    }
                }
                
                if (this.lastPendingCount === -1) {
                    this.lastPendingCount = currentCount;
                } else {
                    this.lastPendingCount = currentCount;
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        };
        
        this.lastPendingCount = -1;
        if (this.notifInterval) clearInterval(this.notifInterval);
        
        setTimeout(check, 2000);
        this.notifInterval = setInterval(check, 10000);
    }
    
    playNotificationSound() {
        // Kept for backward compatibility if needed, but not used by default now
    }
    
    async subscribeUserToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const res = await fetch('/api/vapidPublicKey');
            if (!res.ok) return;
            const vapidPublicKey = await res.text();
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
            
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: auth.currentUser.id, subscription })
            });
        } catch (e) {
            console.error('Push subscription failed:', e);
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize App
window.app = new App();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Global Event Listeners for dynamically generated buttons
document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-details-btn');
    if (viewBtn) {
        const recordId = viewBtn.dataset.recordId;
        const readOnly = viewBtn.dataset.readOnly === 'true';
        window.app.viewRecordDetails(recordId, readOnly);
        return;
    }

    const deleteBtn = e.target.closest('.delete-record-btn');
    if (deleteBtn) {
        const recordId = deleteBtn.dataset.recordId;
        window.app.deleteRecord(recordId);
        return;
    }
});

    if (window.PullToRefresh) {
        PullToRefresh.init({
            mainElement: 'body',
            instructionsPullToRefresh: ''3-( DD#3AD DD*-/J+',
            instructionsReleaseToRefresh: '#AD* DD*-/J+',
            instructionsRefreshing: ','1J 'D*-/J+...',
            onRefresh() {
                window.location.reload();
            }
        });
    }


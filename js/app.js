// Main Application Logic

class App {
    constructor() {
        this.currentWorkers = [];
        this.directoryWorkers = [];
        this.init();
    }

    async init() {
        await auth.init();
        
        // Setup current date badge
        const today = new Date().toISOString().split('T')[0];
        const dateBadge = document.getElementById('current-date-badge');
        if(dateBadge) dateBadge.innerText = today;
        
        const dateInput = document.getElementById('record-date');
        if(dateInput) dateInput.value = today;

        this.attachEventListeners();
        
        if (auth.isLoggedIn()) {
            this.setupWorkspace();
        } else {
            UI.showView('view-login');
        }
    }

    attachEventListeners() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            try {
                if (await auth.login(user, pass)) {
                    this.setupWorkspace();
                } else {
                    alert('اسم المستخدم أو كلمة المرور غير صحيحة');
                }
            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء تسجيل الدخول: " + err.message);
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.logout();
        });

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
                alert('تم إضافة المستخدم بنجاح');
            } catch (err) {
                alert('اسم المستخدم موجود بالفعل أو حدث خطأ');
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
                    alert('عفواً، اسم العامل مسجل بالفعل في قاعدة العمال. لا يمكن إضافة نفس الاسم مرتين.');
                    return;
                }

                await db.add('worker_directory', { name, type, defaultAmount: amount });
                document.getElementById('add-dir-worker-form').reset();
                this.loadAdminData();
                alert('تم إضافة العامل لقاعدة البيانات بنجاح');
            } catch (err) {
                alert('حدث خطأ');
            }
        });
        
        // Supervisor: Add Worker Row
        document.getElementById('add-worker-btn').addEventListener('click', () => {
            this.addWorkerRow();
        });
        
        // Supervisor: Submit Record
        document.getElementById('record-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitRecord();
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
        
        UI.updateNavigation(role);
        
        if (role === 'admin') {
            this.loadAdminData();
            this.loadEngineerData();
            this.generateReport();
        } else if (role === 'engineer') {
            this.loadEngineerData();
            this.generateReport();
        } else if (role === 'supervisor' || role === 'surveyor' || role === 'warehouse_manager' || role === 'operator_supervisor') {
            await UI.renderEngineerOptions();
            this.directoryWorkers = await db.getAll('worker_directory');
            this.loadSupervisorData();
            // Add first empty worker row
            this.currentWorkers = [];
            document.getElementById('workers-list').innerHTML = '';
            this.addWorkerRow();
            this.updateTotals();
        } else if (role === 'engineer') {
            this.loadEngineerData();
        }
    }

    // --- Admin Functions ---
    async loadAdminData() {
        const users = await db.getAll('users');
        UI.renderUsersTable(users, auth.currentUser.id);
        
        const dirWorkers = await db.getAll('worker_directory');
        UI.renderDirWorkersTable(dirWorkers);
        
        const records = await db.getRecordsWithDetails(null, null, null, null);
        UI.renderAdminRecords(records);
    }

    async deleteUser(id) {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            await db.delete('users', id);
            this.loadAdminData();
        }
    }

    async editUser(id) {
        const user = await db.getById('users', id);
        if (!user) return;
        
        const newPassword = prompt(`أدخل كلمة المرور الجديدة للمستخدم (${user.username}):`, user.password);
        if (newPassword === null) return; // User cancelled
        
        const roleOptions = "supervisor (مشرف)\nengineer (مهندس)\nsurveyor (مساح)\nwarehouse_manager (مدير مخزن)\noperator_supervisor (مشرف مشغل)\nadmin (مدير)";
        let newRole = prompt(`أدخل الصلاحية الجديدة للمستخدم من الخيارات التالية:\n\n${roleOptions}`, user.role);
        
        if (newRole === null) return;
        newRole = newRole.trim().toLowerCase();
        
        const validRoles = ['supervisor', 'engineer', 'admin', 'surveyor', 'warehouse_manager', 'operator_supervisor'];
        if (!validRoles.includes(newRole)) {
            alert('صلاحية غير صالحة. تم إلغاء التعديل.');
            return;
        }

        user.password = newPassword;
        user.role = newRole;
        
        await db.update('users', id, user);
        this.loadAdminData();
        alert('تم التعديل بنجاح');
    }

    async deleteDirWorker(id) {
        if (confirm('هل أنت متأكد من حذف هذا العامل من القاعدة؟')) {
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
                <option value="عامل" ${currentType==='عامل'?'selected':''}>عامل</option>
                <option value="نحات" ${currentType==='نحات'?'selected':''}>نحات</option>
                <option value="صنايعي" ${currentType==='صنايعي'?'selected':''}>صنايعي</option>
                <option value="بوفيه" ${currentType==='بوفيه'?'selected':''}>بوفيه</option>
                <option value="أخرى" ${currentType==='أخرى'?'selected':''}>أخرى</option>
            </select>
        `;
        amountCell.innerHTML = `<input type="number" id="edit-dir-amount-${id}" value="${currentAmount}" style="width: 80px; padding: 5px;">`;
        
        actionsCell.innerHTML = `
            <button class="btn-icon text-success" onclick="app.saveDirWorker('${id}')" title="حفظ"><i class="fas fa-save"></i></button>
            <button class="btn-icon text-danger" onclick="app.loadAdminData()" title="إلغاء"><i class="fas fa-times"></i></button>
        `;
    }

    async saveDirWorker(id) {
        const newName = document.getElementById(`edit-dir-name-${id}`).value.trim();
        const newType = document.getElementById(`edit-dir-type-${id}`).value;
        const newAmount = document.getElementById(`edit-dir-amount-${id}`).value;
        
        if (!newName || !newAmount) {
            alert('يرجى تعبئة جميع الحقول');
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
        
        let optionsHtml = '<option value="" disabled selected>اختر العامل</option>';
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
                    <option value="" disabled selected>النوع</option>
                    <option value="عامل">عامل</option>
                    <option value="نحات">نحات</option>
                    <option value="صنايعي">صنايعي</option>
                    <option value="بوفيه">بوفيه</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </td>
            <td>
                <input type="number" id="worker-amount-${workerId}" required min="0" readonly placeholder="اليومية">
            </td>
            <td>
                <input type="text" id="worker-location-${workerId}" placeholder="مكان العمل">
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
            'عامل': 350,
            'نحات': 400,
            'صنايعي': 550,
            'بوفيه': 350,
            'أخرى': 350
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
        const engineerId = document.getElementById('record-engineer').value;
        
        if (!engineerId) {
            alert('الرجاء اختيار المهندس المسؤول');
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
            
            if (name && amount >= 0) {
                workersData.push({ name, type, amount, location, deduction: 0, notes: '' });
                totalAmount += amount;
                validWorkersCount++;
            }
        }
        
        if (validWorkersCount === 0) {
            alert('الرجاء إدخال بيانات عامل واحد على الأقل');
            return;
        }

        // --- Duplicate Checking Logic ---
        // Fetch all records for the same date
        const allRecords = await db.getAll('records');
        const todaysRecords = allRecords.filter(r => r.date === date);
        const todaysRecordIds = todaysRecords.map(r => r.id);
        
        if (todaysRecordIds.length > 0) {
            const allWorkers = await db.getAll('workers');
            const todaysWorkers = allWorkers.filter(w => todaysRecordIds.includes(w.recordId));
            
            const users = await db.getAll('users');
            
            for (let newWorker of workersData) {
                const duplicate = todaysWorkers.find(tw => tw.name === newWorker.name);
                if (duplicate) {
                    const dupRecord = todaysRecords.find(r => r.id === duplicate.recordId);
                    const supervisor = users.find(u => u.id === dupRecord.supervisorId);
                    const supervisorName = supervisor ? supervisor.username : 'مشرف آخر';
                    alert(`عفواً، لا يمكن إرسال السركي. العامل "${newWorker.name}" مسجل اليوم بالفعل بواسطة المشرف "${supervisorName}".`);
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
                status: 'pending',
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
            
            alert('تم إرسال السركي للاعتماد بنجاح');
            
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
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    }

    async deleteRecord(recordId) {
        if (!confirm('هل أنت متأكد من مسح هذا السركي؟')) return;
        
        try {
            // Delete record
            await db.delete('records', recordId);
            
            // Delete associated workers
            const workers = await db.getByField('workers', 'recordId', recordId);
            for (let w of workers) {
                await db.delete('workers', w.id);
            }
            
            alert('تم مسح السركي بنجاح');
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
            alert('حدث خطأ أثناء المسح');
        }
    }

    // --- Engineer Functions ---
    async loadEngineerData() {
        const role = auth.getRole();
        const engineerId = role === 'admin' ? null : auth.currentUser.id;
        const records = await db.getRecordsWithDetails(null, null, engineerId, null);
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
            record.supervisorName = supervisor ? supervisor.username : 'غير معروف';
            
            await UI.renderRecordDetailsModal(record, workers, readOnly);
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء فتح التفاصيل: " + e.message);
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
            'عامل': 350,
            'نحات': 400,
            'صنايعي': 550,
            'بوفيه': 350,
            'أخرى': 350
        };
        
        if (rates[selectedType] !== undefined) {
            amountInput.value = rates[selectedType];
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
                        
                        await db.update('workers', worker.id, worker);
                    }
                    
                    // Calculate total
                    const netAmount = (Number(worker.amount) || 0) - (Number(worker.deduction) || 0);
                    newTotalAmount += netAmount > 0 ? netAmount : 0;
                }
                record.totalAmount = newTotalAmount;
            }
            
            record.status = status;
            await db.update('records', recordId, record); 
            document.getElementById('record-modal').classList.add('hidden');
            
            const role = auth.getRole();
            if (role === 'admin') {
                this.loadAdminData();
                this.loadEngineerData();
                this.generateReport();
            } else if (role === 'engineer') {
                this.loadEngineerData();
                this.generateReport();
            }
            
            alert(`تم ${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح`);
        }
    }

    // --- Reports Functions ---
    async generateReport() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const workerName = document.getElementById('filter-worker-name').value.trim().toLowerCase();
        
        if (startDate && endDate) {
            document.getElementById('print-date-range').innerText = `الفترة من ${startDate} إلى ${endDate}`;
        } else {
            document.getElementById('print-date-range').innerText = `جميع السجلات من بداية العمل`;
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
        
        let filteredWorkers = allWorkers.filter(w => validRecordIds.includes(w.recordId));
        
        if (workerName) {
            filteredWorkers = filteredWorkers.filter(w => w.name.toLowerCase().includes(workerName));
        }
        
        UI.renderReportResults(filteredWorkers, recordsMap, usersMap);
    }
}

// Initialize App
window.app = new App();

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

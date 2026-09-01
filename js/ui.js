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
                <li><a href="#" data-view="view-admin"><i class="fas fa-users-cog"></i> لوحة الإدارة</a></li>
                <li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"></i> اعتماد السراكي</a></li>
                <li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"></i> التقارير المجمعة</a></li>
            `;
        } else if (role === 'engineer') {
            navLinks.innerHTML += `
                <li><a href="#" data-view="view-engineer"><i class="fas fa-check-double"></i> اعتماد السراكي</a></li>
                <li><a href="#" data-view="view-reports"><i class="fas fa-chart-bar"></i> التقارير المجمعة</a></li>
            `;
        } else if (role === 'supervisor' || role === 'surveyor' || role === 'warehouse_manager' || role === 'operator_supervisor') {
            navLinks.innerHTML += `
                <li><a href="#" data-view="view-supervisor"><i class="fas fa-file-signature"></i> تسجيل سركي</a></li>
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
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username === 'admin' ? 'Bishoy Mamdouh' : user.username}</td>
                <td><span class="badge badge-approved">${auth.getRoleNameAr(user.role)}</span></td>
                <td>
                    ${user.id !== currentUserId ? `
                        <button class="btn-icon text-primary" onclick="app.editUser('${user.id}')" title="تعديل الباسورد والصلاحية"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon text-danger" onclick="app.deleteUser('${user.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                    ` : '<small class="text-muted">حسابك</small>'}
                </td>
            `;
            tbody.appendChild(tr);
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
                    <button class="btn-icon text-primary" onclick="app.editDirWorker('${w.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon text-danger" onclick="app.deleteDirWorker('${w.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    static async renderEngineerOptions() {
        const users = await db.getAll('users');
        const engineers = users.filter(u => u.role === 'engineer' || u.role === 'admin');
        const select = document.getElementById('record-engineer');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>اختر المهندس</option>';
            engineers.forEach(eng => {
                let displayName = eng.username === 'admin' ? 'Bishoy Mamdouh' : eng.username;
                select.innerHTML += `<option value="${eng.id}">${displayName}</option>`;
            });
        }
    }

    static generateRecordCardHTML(r, role = 'admin') {
        const statusBadge = this.getStatusBadge(r.status);
        const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        let headerHtml = `
            <div class="card mb-20">
                <div class="record-card-header flex-between mb-10" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                    <div>
                        <strong>${r.date}</strong> <span dir="ltr" style="font-size:0.85em; color:var(--text-muted);">(${timeStr})</span>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div class="record-card-info form-row mb-10">
                    <div class="half"><strong>المشرف:</strong> ${r.supervisorName === 'admin' ? 'Bishoy Mamdouh' : r.supervisorName}</div>
                    <div class="half"><strong>المهندس:</strong> ${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</div>
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
                            <th>الاسم</th>
                            <th>النوع</th>
                            <th>اليومية</th>
                            <th>المكان</th>
                            <th>خصم</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let currentTotal = r.totalAmount || 0;
        
        (r.workers || []).forEach(w => {
            if (isEditable) {
                workersHtml += `
                    <tr>
                        <td>${w.name}</td>
                        <td>
                            <select id="card-type-${w.id}" class="modal-input" style="width: 80px;" onchange="app.onModalTypeChange('${w.id}', '${w.name}')">
                                <option value="عامل" ${w.type==='عامل'?'selected':''}>عامل</option>
                                <option value="نحات" ${w.type==='نحات'?'selected':''}>نحات</option>
                                <option value="صنايعي" ${w.type==='صنايعي'?'selected':''}>صنايعي</option>
                                <option value="بوفيه" ${w.type==='بوفيه'?'selected':''}>بوفيه</option>
                                <option value="أخرى" ${w.type==='أخرى'?'selected':''}>أخرى</option>
                            </select>
                        </td>
                        <td><input type="number" id="card-amount-${w.id}" value="${w.amount}" class="modal-input" style="width: 70px;"></td>
                        <td><input type="text" id="card-location-${w.id}" value="${w.location || ''}" class="modal-input" style="width: 100px;"></td>
                        <td><input type="number" id="card-deduction-${w.id}" value="${w.deduction || 0}" class="modal-input" style="width: 70px;"></td>
                        <td><input type="text" id="card-notes-${w.id}" value="${w.notes || ''}" class="modal-input" style="width: 150px;"></td>
                    </tr>
                `;
            } else {
                workersHtml += `
                    <tr>
                        <td>${w.name}</td>
                        <td>${w.type}</td>
                        <td>${w.amount}</td>
                        <td>${w.location || '-'}</td>
                        <td>${w.deduction || 0}</td>
                        <td>${w.notes || '-'}</td>
                    </tr>
                `;
            }
        });
        
        workersHtml += `
                    </tbody>
                </table>
            </div>
            <div class="flex-between mb-10">
                <strong>الإجمالي: ${currentTotal.toLocaleString()} جنية</strong>
                <small>العمال: ${r.totalWorkers}</small>
            </div>
        `;
        
        let actionsHtml = `<div class="record-card-actions flex-end" style="gap:10px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">`;
        
        if (isEditable) {
            // Need to save workers to global context for approval to grab their values
            actionsHtml += `
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = ${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = 'card'; app.updateRecordStatus('${r.id}', 'approved')"><i class="fas fa-check"></i> اعتماد</button>
                <button class="btn btn-danger btn-small" onclick="app.updateRecordStatus('${r.id}', 'rejected')"><i class="fas fa-times"></i> رفض</button>
            `;
        }
        
        if (role === 'supervisor' && r.status === 'pending') {
            actionsHtml += `<button class="btn btn-danger btn-small delete-record-btn" data-record-id="${r.id}"><i class="fas fa-trash"></i> حذف السركي</button>`;
        }
        
        if (isAdmin) {
             actionsHtml += `<button class="btn btn-danger btn-small delete-record-btn" data-record-id="${r.id}"><i class="fas fa-trash"></i> حذف من النظام</button>`;
        }
        
        actionsHtml += `</div></div>`; // close card
        
        return headerHtml + workersHtml + actionsHtml;
    }

    static renderSupervisorRecords(records) {
        const container = document.getElementById('supervisor-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">لا توجد سراكي سابقة</div>';
            return;
        }

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, 'supervisor');
        });
    }

    static renderEngineerRecords(records, role = 'engineer') {
        const container = document.getElementById('engineer-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">لا توجد طلبات للعرض</div>';
            return;
        }

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, role);
        });
    }

    static renderAdminRecords(records) {
        const container = document.getElementById('admin-records-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<div class="text-center p-20">لا توجد سراكي حتى الآن</div>';
            return;
        }
        
        // sort by newest
        records.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        records.forEach(r => {
            container.innerHTML += this.generateRecordCardHTML(r, 'admin');
        });
    }
    
    static async renderRecordDetailsModal(record, workers, readOnly = false) {
        const modal = document.getElementById('record-modal');
        const body = document.getElementById('record-modal-body');
        const footer = document.getElementById('record-modal-footer');
        
        // Store workers globally for app.js to access when approving
        window.currentModalWorkers = workers;
        
        let html = `
            <div class="form-row mb-10">
                <div class="half"><strong>التاريخ:</strong> ${record.date}</div>
                <div class="half"><strong>المشرف:</strong> ${record.supervisorName}</div>
            </div>
            <div style="overflow-x:auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>النوع</th>
                        <th>اليومية</th>
                        <th>مكان العمل</th>
                        <th>خصم</th>
                        <th>ملاحظات</th>
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
                            <select id="modal-type-${w.id}" class="modal-input" style="width: 80px;" onchange="app.onModalTypeChange('${w.id}', '${w.name}')">
                                <option value="عامل" ${w.type==='عامل'?'selected':''}>عامل</option>
                                <option value="نحات" ${w.type==='نحات'?'selected':''}>نحات</option>
                                <option value="صنايعي" ${w.type==='صنايعي'?'selected':''}>صنايعي</option>
                                <option value="بوفيه" ${w.type==='بوفيه'?'selected':''}>بوفيه</option>
                                <option value="أخرى" ${w.type==='أخرى'?'selected':''}>أخرى</option>
                            </select>
                        </td>
                        <td><input type="number" id="modal-amount-${w.id}" value="${w.amount}" class="modal-input" style="width: 70px;"></td>
                        <td><input type="text" id="modal-location-${w.id}" value="${w.location || ''}" class="modal-input" style="width: 100px;"></td>
                        <td><input type="number" id="modal-deduction-${w.id}" value="${w.deduction || 0}" class="modal-input" style="width: 70px;"></td>
                        <td><input type="text" id="modal-notes-${w.id}" value="${w.notes || ''}" class="modal-input" style="width: 150px;"></td>
                    </tr>
                `;
            }
        });
        
        html += `
                </tbody>
            </table>
            </div>
            <div style="margin-top: 10px; font-weight: bold;">الإجمالي للمبلغ: ${(record.totalAmount || workers.reduce((sum, w) => sum + (Number(w.amount) || 0) - (Number(w.deduction) || 0), 0)).toLocaleString()} جنية</div>
            ${readOnly ? '' : '<div style="font-size: 0.9em; color: #666;">يمكنك تعديل أي بيانات أعلاه قبل الاعتماد. سيتم حساب الإجمالي النهائي تلقائياً.</div>'}
        `;
        
        body.innerHTML = html;
        
        if (readOnly || record.status !== 'pending') {
            footer.classList.add('hidden');
        } else {
            footer.classList.remove('hidden');
            document.getElementById('approve-record-btn').onclick = () => app.updateRecordStatus(record.id, 'approved');
            document.getElementById('reject-record-btn').onclick = () => app.updateRecordStatus(record.id, 'rejected');
        }
        
        modal.classList.remove('hidden');
    }

    static getStatusBadge(status) {
        if (status === 'pending') return '<span class="badge badge-pending">قيد المراجعة</span>';
        if (status === 'approved') return '<span class="badge badge-approved">معتمد</span>';
        if (status === 'rejected') return '<span class="badge badge-rejected">مرفوض</span>';
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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات مطابقة للبحث</td></tr>';
        } else {
            workers.forEach(w => {
                const record = recordsMap[w.recordId];
                if(record && record.status === 'approved') {
                    const supervisorName = usersMap[record.supervisorId] ? usersMap[record.supervisorId].username : 'غير معروف';
                    totalDays += 1;
                    totalAmount += Number(w.amount);
                    
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${w.name}</strong></td>
                            <td>${w.type}</td>
                            <td>${supervisorName}</td>
                            <td>${record.date}</td>
                            <td>${w.amount}</td>
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
                // Add filter for Name (0), Type (1), Supervisor (2), Date (3)
                if ([0, 1, 2, 3].includes(index)) {
                    const select = document.createElement('select');
                    select.className = 'form-control report-col-filter';
                    select.style.marginTop = '5px';
                    select.style.fontSize = '0.85em';
                    select.style.padding = '2px';
                    select.dataset.colIndex = index;
                    select.innerHTML = '<option value="">الكل</option>';
                    th.appendChild(select);
                    
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
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">الكل</option>';
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
            }
        });
        
        document.getElementById('report-total-days').innerText = visibleCount;
        document.getElementById('report-total-amount').innerText = visibleTotal.toLocaleString();
    }
}

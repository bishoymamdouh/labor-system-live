generateRecordCardHTML(r, role = 'admin', view = 'default') {
        const statusBadge = this.getStatusBadge(r.status);
        const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        let headerHtml = `
            <div id="record-card-${r.id}" class="card mb-30 record-scroll-target" style="margin-bottom: 30px;">
                <div class="record-card-header flex-between mb-10" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                    <div>
                        <strong>${r.date}</strong> <span dir="ltr" style="font-size:0.85em; color:var(--text-muted);">(${timeStr})</span>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div class="record-card-info form-row mb-10" style="align-items: center;">
                    <div class="half"><strong>المشرف:</strong> <span class="badge-glow badge-glow-supervisor"><i class="fas fa-user-tie"></i> ${r.supervisorName === 'admin' ? 'Bishoy Mamdouh' : r.supervisorName}</span></div>
                    <div class="half"><strong>المهندس:</strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"></i> ${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</span></div>
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
                            ${isEditable ? '<th>إجراءات</th>' : ''}
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
                                <option value="عامل" ${w.type==='عامل'?'selected':''}>عامل</option>
                                <option value="نحات" ${w.type==='نحات'?'selected':''}>نحات</option>
                                <option value="صنايعى" ${w.type==='صنايعى'?'selected':''}>صنايعى</option>
                                <option value="مشرف عمال" ${w.type==='مشرف عمال'?'selected':''}>مشرف عمال</option>
                                <option value="بوفيه" ${w.type==='بوفيه'?'selected':''}>بوفيه</option>
                                <option value="اخرى" ${w.type==='اخرى'?'selected':''}>اخرى</option>
                            </select>
                        </td>
                        <td><input type="number" id="${view}-card-amount-${w.id}" value="${w.amount}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="${view}-card-location-${w.id}" value="${w.location || ''}" class="modal-input" style="width: 110px;"></td>
                        <td><input type="number" id="${view}-card-deduction-${w.id}" value="${w.deduction || 0}" class="modal-input" style="width: 75px;"></td>
                        <td><input type="text" id="${view}-card-notes-${w.id}" value="${w.notes || ''}" class="modal-input" style="min-width: 130px; width: 100%;"></td>
                        <td>
                            <button type="button" class="btn-icon text-danger" onclick="app.removeWorkerFromRecord('${r.id}', '${w.id}')" title="حذف العامل"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            } else {
                let deletedStyle = w.isDeleted ? 'text-decoration: line-through; opacity: 0.6;' : '';
                let deletedBadge = w.isDeleted ? '<span class="badge badge-rejected" style="margin-right: 5px;">محذوف</span>' : '';
                let deductionBadge = (!w.isDeleted && w.deduction > 0) ? `<span class="badge badge-pending" style="margin-right: 5px; font-size: 0.75rem;">خصم ${w.deduction}</span>` : '';
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
                <strong>الإجمالي: ${currentTotal.toLocaleString()} جنية</strong>
                <small>العمال: ${r.totalWorkers}</small>
            </div>
        `;
        
        let actionsHtml = `<div class="record-card-actions flex-end" style="gap:10px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">`;
        
        if (isEditable) {
            // Need to save workers to global context for approval to grab their values
            actionsHtml += `
                <button class="btn btn-primary btn-small" onclick="window.currentModalWorkers = ${JSON.stringify(r.workers || []).replace(/"/g, '&quot;')}; window.currentCardPrefix = '${view}-card'; app.updateRecordStatus('${r.id}', 'approved', this)"><i class="fas fa-check"></i> اعتماد</button>
                <button class="btn btn-danger btn-small" onclick="window.currentCardPrefix = '${view}-card'; app.updateRecordStatus('${r.id}', 'rejected', this)"><i class="fas fa-times"></i> رفض</button>
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
            container.innerHTML += this.generateRecordCardHTML(r, 'supervisor', 'supervisor');
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
            container.innerHTML += this.generateRecordCardHTML(r, role, 'engineer');
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
                <div class="half"><strong>التاريخ:</strong> ${record.date}</div>
                <div class="half"><strong>المشرف:</strong> <span class="badge-glow badge-glow-supervisor"><i class="fas fa-user-tie"></i> ${record.supervisorName === 'admin' ? 'Bishoy Mamdouh' : record.supervisorName}</span></div>
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
                            <select id="modal-type-${w.id}" class="modal-input" style="width: 110px;" onchange="app.onModalTypeChange('${w.id}', '${w.name}')">
                                <option value="عامل" ${w.type==='عامل'?'selected':''}>عامل</option>
                                <option value="نحات" ${w.type==='نحات'?'selected':''}>نحات</option>
                                <option value="صنايعى" ${w.type==='صنايعى'?'selected':''}>صنايعى</option>
                                <option value="مشرف عمال" ${w.type==='مشرف عمال'?'selected':''}>مشرف عمال</option>
                                <option value="بوفيه" ${w.type==='بوفيه'?'selected':''}>بوفيه</option>
                                <option value="اخرى" ${w.type==='اخرى'?'selected':''}>اخرى</option>
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
            <div style="margin-top: 10px; font-weight: bold;">الإجمالي للمبلغ: ${(record.totalAmount || workers.reduce((sum, w) => sum + (Number(w.amount) || 0) - (Number(w.deduction) || 0), 0)).toLocaleString()} جنية</div>
            ${readOnly ? '' : '<div style="font-size: 0.9em; color: #666;">يمكنك تعديل أي بيانات أعلاه قبل الاعتماد. سيتم حساب الإجمالي النهائي تلقائياً.</div>'}
        `;
        
        body.innerHTML = html;
        
        
        if (readOnly || record.status !== 'pending') {
            footer.classList.add('hidden');
        } else {
            footer.classList.remove('hidden');
            
            // Unbind previous listeners to avoid duplicates
            const approveBtn = document.getElementById('approve-record-btn');
            const rejectBtn = document.getElementById('reject-record-btn');
            const forwardBtn = document.getElementById('forward-record-btn');
            
            const newApproveBtn = approveBtn.cloneNode(true);
            approveBtn.parentNode.replaceChild(newApproveBtn, approveBtn);
            
            const newRejectBtn = rejectBtn.cloneNode(true);
            rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
            
            let newForwardBtn = null;
            if (forwardBtn) {
                newForwardBtn = forwardBtn.cloneNode(true);
                forwardBtn.parentNode.replaceChild(newForwardBtn, forwardBtn);
            }
            
            // Populate engineer dropdown
            const forwardSelect = document.getElementById('forward-engineer-select');
            if (forwardSelect) {
                forwardSelect.innerHTML = '<option value="">-- اختر مهندس (اختياري) --</option>';
                let engineers = [];
                try {
                    const users = await window.app.db.getAll('users');
                    engineers = users.filter(u => u.role === 'engineer' && String(u.id) !== String(window.app.currentUser.id));
                } catch(e) {}
                engineers.forEach(eng => {
                    const opt = document.createElement('option');
                    opt.value = eng.id;
                    opt.textContent = eng.username || eng.name;
                    forwardSelect.appendChild(opt);
                });
            }
            
            newApproveBtn.onclick = async () => {
                if (forwardSelect && forwardSelect.value) {
                    try {
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title: 'Request for your information', 
                                message: 'تم اعتماد السركي الخاص بالمشرف ' + (record.supervisorName || '') + '، يرجى الاطلاع على التفاصيل والملاحظات.', 
                                target: [forwardSelect.value] 
                            })
                        });
                    } catch (e) {
                        console.error('Failed to send FYI notification', e);
                    }
                }
                window.currentCardPrefix = 'modal';
                app.updateRecordStatus(record.id, 'approved', newApproveBtn);
            };
            
            newRejectBtn.onclick = () => {
                window.currentCardPrefix = 'modal';
                app.updateRecordStatus(record.id, 'rejected', newRejectBtn);
            };
            
            if (newForwardBtn) {
                newForwardBtn.onclick = async () => {
                    const forwardEng = forwardSelect ? forwardSelect.value : null;
                    if (!forwardEng) {
                        alert('يرجى اختيار مهندس لتحويل الطلب إليه');
                        return;
                    }
                    
                    try {
                        const origHtml = newForwardBtn.innerHTML;
                        newForwardBtn.disabled = true;
                        newForwardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                        
                        record.engineerId = forwardEng;
                        record.forwardedBy = window.app.currentUser.username || window.app.currentUser.name;
                        
                        await app.db.update('records', record.id, record);
                        
                        await fetch('/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title: 'طلب اعتماد محول', 
                                message: 'تم تحويل طلب اعتماد إليك من المهندس ' + (window.app.currentUser.username || window.app.currentUser.name) + ' (المرسل الأصلي: ' + (record.supervisorName || '') + ')', 
                                target: [forwardEng] 
                            })
                        });
                        
                        alert('تم تحويل الطلب بنجاح');
                        modal.classList.add('hidden');
                        app.loadEngineerData();
                    } catch (e) {
                        console.error(e);
                        alert('حدث خطأ أثناء التحويل');
                        if (newForwardBtn) {
                            newForwardBtn.disabled = false;
                            newForwardBtn.innerHTML = '<i class="fas fa-share"></i> إرسال';
                        }
                    }
                };
            }
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
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">لا توجد بيانات مطابقة للبحث</td></tr>';
        } else {
            workers.forEach(w => {
                const record = recordsMap[w.recordId];
                if(record && record.status === 'approved') {
                    const supervisorName = usersMap[record.supervisorId] ? usersMap[record.supervisorId].username : 'غير معروف';
                    const engineerName = usersMap[record.engineerId] ? usersMap[record.engineerId].username : 'غير معروف';
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
                            <td>${w.location || ''}</td>
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


    // Listen for instant jump messages from Service Worker
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'JUMP_TO_RECORD') {
                const viewRecordId = event.data.id;
                const activeView = document.querySelector('.view:not(.hidden)'); const target = activeView ? activeView.querySelector('#record-card-' + viewRecordId) : document.getElementById('record-card-' + viewRecordId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.transition = "all 0.5s ease";
                    target.style.boxShadow = "0 0 20px 5px #ffd700";
                    target.style.border = "3px solid #ffd700";
                    target.style.transform = "scale(1.02)";
                    setTimeout(() => { target.style.transform = "scale(1)"; }, 1000);
                    setTimeout(() => { target.style.boxShadow = "var(--shadow)"; target.style.border = "none"; }, 5000);
                } else {
                    // Not in DOM, fallback to slow load
                    window.location.href = '/?view_record=' + viewRecordId;
                }
            }
        });
    }

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
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحضير...';
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
            const ws = wb.addWorksheet('تفاصيل العمالة', { views: [{ rightToLeft: true }] });

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
            footerRow.getCell(1).value = 'إجمالي عدد اليوميات:';
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
            alert('حدث خطأ أثناء تصدير الإكسيل.');
            const btn = document.querySelector('button[onclick="app.exportStyledExcel()"]');
            if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-excel"></i> إكسيل <i class="fas fa-download"></i>'; }
        }
    }

    async init() {
        await 
        auth.init();
        
        // Deep linking scroll handled in render 

        
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

    
    async syncOfflineRecords() {
        let queue = JSON.parse(localStorage.getItem('offline_records') || '[]');
        if (queue.length === 0) return;
        
        console.log("Syncing offline records...");
        let newQueue = [];
        let successCount = 0;
        
        for (let payload of queue) {
            try {
                const recordId = payload.record.id;
                await db.add('records', payload.record);
                for (let worker of payload.workers) {
                    await db.add('workers', {
                        recordId: recordId,
                        name: worker.name,
                        type: worker.type,
                        amount: worker.amount,
                        deduction: worker.deduction,
                        location: worker.location,
                        notes: worker.notes
                    });
                }
                successCount++;
            } catch (e) {
                console.error("Failed to sync offline record", e);
                newQueue.push(payload);
            }
        }
        
        localStorage.setItem('offline_records', JSON.stringify(newQueue));
        if (successCount > 0) {
            alert('تم رفع ' + successCount + ' سراكي محفوظة مسبقاً (Offline) بنجاح!');
            this.loadSupervisorData();
        }
    }
    
    attachEventListeners() {
        window.addEventListener('online', () => {
            console.log("Network came online. Attempting offline sync...");
            this.syncOfflineRecords();
        });
        // Try on load just in case
        setTimeout(() => this.syncOfflineRecords(), 3000);
        
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
                                alert('حدث خطأ أثناء حفظ الصورة: ' + err.message);
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
                alert('تم تعيين كلمة المرور بنجاح! جاري تسجيل الدخول...');
                
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (await auth.login(user.username, newPass)) {
                    this.setupWorkspace();
                }
            } catch (err) {
                alert('حدث خطأ أثناء تعيين كلمة المرور');
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
                titleSpan.innerText = "جميع المستخدمين";
            } else if (checked === 0) {
                titleSpan.innerText = "لم يتم تحديد أحد";
            } else {
                titleSpan.innerText = `تم تحديد (${checked}) مستخدمين`;
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
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                btn.disabled = true;
                
                try {
                    const title = document.getElementById('broadcast-title').value;
                    const message = document.getElementById('broadcast-message').value;
                    
                    let target = "all";
                    const allCheckbox = document.getElementById('broadcast-target-all');
                    if (allCheckbox && !allCheckbox.checked) {
                        const checked = Array.from(document.querySelectorAll('.broadcast-user-checkbox:checked')).map(cb => cb.value);
                        if (checked.length === 0) {
                            alert('الرجاء اختيار مستخدم واحد على الأقل');
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
                        alert(`تم إرسال الإشعار بنجاح إلى ${data.sent} جهاز/مستخدم.`);
                        broadcastForm.reset();
                    } else {
                        let errText = await res.text();
                        try { errText = JSON.parse(errText).error || errText; } catch(e) {}
                        alert('حدث خطأ اثناء الارسال: ' + (errText || res.status));
                    }
                } catch (err) {
                    console.error(err);
                    alert('خطأ في الاتصال بالخادم: ' + err.message);
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
                
                if (confirm('تحذير: استعادة النظام من ملف خارجي سيؤدي إلى الكتابة فوق جميع البيانات الحالية. هل أنت متأكد من المتابعة؟')) {
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
                                alert('تم استعادة النظام بنجاح! سيتم إعادة تحديث الصفحة.');
                                window.location.reload();
                            } else {
                                alert('فشل في استعادة النظام.');
                            }
                        } catch (err) {
                            console.error(err);
                            alert('ملف غير صالح.');
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
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalHtml = submitBtn.innerHTML;
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
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
        if (role === 'supervisor') {
            if (!document.getElementById('supervisor-hide-wage')) {
                document.head.insertAdjacentHTML('beforeend', '<style id="supervisor-hide-wage">#workers-table th:nth-child(3), #workers-table td:nth-child(3), #summary-total-amount { display: none !important; }</style>');
            }
        } else {
            const styleNode = document.getElementById('supervisor-hide-wage');
            if (styleNode) styleNode.remove();
        }

        // removed duplicate const role
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
            document.getElementById('record-date').removeAttribute('readonly');
            document.getElementById('record-date').style = 'background-color: white; color: black; font-weight: normal;';
            // Removed emptying date
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
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
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
                alert('رابط الدعوة غير صالح أو منتهي.');
                UI.showView('view-login');
            }
        } catch (e) {
            UI.showView('view-login');
        }
    }

    copyInviteLink(userId) {
        const link = window.location.origin + window.location.pathname + '?invite=' + userId;
        navigator.clipboard.writeText(link).then(() => {
            alert('تم نسخ رابط الدخول بنجاح!\nيمكنك الآن إرساله للمشرف ليعين كلمة المرور الخاصة به.');
        }).catch(err => {
            alert('فشل النسخ تلقائياً. انسخ الرابط التالي:\n' + link);
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
        passCell.innerHTML = `<input type="text" id="edit-user-pass-${id}" value="${currentPass}" placeholder="باسورد جديد" style="width:100%; padding: 5px;">`;
        roleCell.innerHTML = `
            <select id="edit-user-role-${id}" style="width:100%; padding: 5px;">
                <option value="supervisor" ${currentRole==='supervisor'?'selected':''}>مشرف</option>
                <option value="surveyor" ${currentRole==='surveyor'?'selected':''}>مساح</option>
                <option value="warehouse_manager" ${currentRole==='warehouse_manager'?'selected':''}>مدير مخزن</option>
                <option value="operator_supervisor" ${currentRole==='operator_supervisor'?'selected':''}>مشرف مشغل</option>
                <option value="engineer" ${currentRole==='engineer'?'selected':''}>مهندس</option>
                <option value="admin" ${currentRole==='admin'?'selected':''}>مدير</option>
            </select>
        `;
        
        actionsCell.innerHTML = `
            <button class="btn-icon text-success" onclick="app.saveUser('${id}')" title="حفظ"><i class="fas fa-save"></i></button>
            <button class="btn-icon text-danger" onclick="app.loadAdminData()" title="إلغاء"><i class="fas fa-times"></i></button>
        `;
    }

    async saveUser(id) {
        const newName = document.getElementById(`edit-user-name-${id}`).value.trim();
        const newPass = document.getElementById(`edit-user-pass-${id}`).value;
        const newRole = document.getElementById(`edit-user-role-${id}`).value;
        
        if (!newName) {
            alert('يرجى كتابة اسم المستخدم');
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
            alert('تم التعديل بنجاح');
        }
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
                <option value="صنايعى" ${currentType==='صنايعى'?'selected':''}>صنايعى</option>
                <option value="مشرف عمال" ${currentType==='مشرف عمال'?'selected':''}>مشرف عمال</option>
                <option value="بوفيه" ${currentType==='بوفيه'?'selected':''}>بوفيه</option>
                <option value="اخرى" ${currentType==='اخرى'?'selected':''}>اخرى</option>
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
            const oldName = worker.name;
            worker.name = newName;
            worker.type = newType;
            worker.defaultAmount = newAmount;
            
            const btn = document.querySelector(`#dir-worker-row-${id} .dir-col-actions button.text-success`);
            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            await db.update('worker_directory', id, worker);
            
            if (oldName !== newName) {
                try {
                    await fetch('/api/updateWorkerName', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldName, newName })
                    });
                } catch (e) {
                    console.error("Error updating historical worker names:", e);
                }
            }

            this.loadAdminData();
        }
    }

    // --- Supervisor Functions ---
    async loadSupervisorData() {
        const records = await db.getRecordsWithDetails(null, auth.currentUser.id, null, null);
        UI.renderSupervisorRecords(records);
        this.highlightRecordFromURL();
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
                    <option value="صنايعى">صنايعى</option>
                    <option value="مشرف عمال">مشرف عمال</option>
                    <option value="بوفيه">بوفيه</option>
                    <option value="اخرى">اخرى</option>
                </select>
            </td>
            <td>
                <input type="number" id="worker-amount-${workerId}" required min="0" ${auth.getRole() === "admin" || auth.getRole() === "engineer" ? "" : "readonly"} placeholder="اليومية" oninput="app.updateTotals()">
            </td>
            <td>
                <input type="text" id="worker-location-${workerId}" placeholder="مكان العمل">
            </td>
            <td>
                <input type="text" id="worker-notes-${workerId}" placeholder="ملاحظات">
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
        let engineerId = document.getElementById('record-engineer').value;
        const role = auth.getRole();
        
        if (role === 'engineer') {
            engineerId = auth.currentUser.id;
        } else if (!engineerId) {
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
            const notes = document.getElementById(`worker-notes-${id}`).value || '';
            
            if (name && amount >= 0) {
                if (!location.trim()) {
                    alert(`الرجاء إدخال مكان العمل للعامل: ${name}`);
                    return;
                }
                workersData.push({ name, type, amount, location, deduction: 0, notes: notes });
                totalAmount += amount;
                validWorkersCount++;
            }
        }
        
        if (validWorkersCount === 0) {
            alert('الرجاء إدخال بيانات عامل واحد على الأقل');
            return;
        }

        // --- Duplicate Checking Logic ---
        const namesInForm = new Set();
        for (let w of workersData) {
            const normalizedName = w.name.trim();
            if (namesInForm.has(normalizedName)) {
                alert(`خطأ: لقد قمت بإدخال اسم العامل "${w.name}" أكثر من مرة في نفس السركي! يرجى حذف التكرار.`);
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
                status: (role === 'admin') ? 'approved' : 'pending',
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
            
            
            if (role === 'engineer') {
                alert('تم تسجيل السركي واعتماده بنجاح');
            } else {
                alert('تم إرسال السركي للاعتماد بنجاح');
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
            if (!navigator.onLine || error.message.includes('fetch') || error.message.includes('retries')) {
                const offlinePayload = {
                    record: {
                        id: crypto.randomUUID(),
                        date: date,
                        supervisorId: auth.currentUser.id,
                        engineerId: engineerId,
                        status: (role === 'admin') ? 'approved' : 'pending',
                        totalWorkers: validWorkersCount,
                        totalAmount: totalAmount,
                        createdAt: new Date().toISOString()
                    },
                    workers: workersData
                };
                let queue = JSON.parse(localStorage.getItem('offline_records') || '[]');
                queue.push(offlinePayload);
                localStorage.setItem('offline_records', JSON.stringify(queue));
                alert('لا يوجد اتصال! تم حفظ السركي مؤقتاً في الهاتف وسيتم رفعه تلقائياً عند عودة الإنترنت.');
                
                document.getElementById('record-form').reset();
                document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('workers-list').innerHTML = '';
                this.currentWorkers = [];
                this.addWorkerRow();
                this.updateTotals();
            } else {
                alert('حدث خطأ أثناء حفظ البيانات');
            }
        }
    }

        async deleteRecord(recordId, btn = null) {
        if (!confirm('هل أنت متأكد من مسح هذا السركي؟')) return;
        
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        }
        
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
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
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
            alert('لا يوجد سراكي لحذفها.');
            return;
        }

        if (!confirm(`هل أنت متأكد من حذف ${records.length} سركي نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;

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
            alert('تم حذف جميع السراكي المحددة بنجاح.');
            this.loadEngineerData();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحذف.');
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

        let filterDate = null;
        const dateInput = document.getElementById('engineer-date-filter');
        if (dateInput && dateInput.value) {
            filterDate = { start: dateInput.value, end: dateInput.value };
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, filterDate);
        UI.renderEngineerRecords(records, role);
        this.highlightRecordFromURL();
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
    
    async removeWorkerFromRecord(recordId, workerId) {
        if (!confirm('هل أنت متأكد من حذف هذا العامل من السركي؟')) return;
        
        try {
            const worker = await db.getById('workers', workerId);
            if (worker) {
                worker.isDeleted = true;
                await db.update('workers', workerId, worker);
            }
            
            // Fetch updated workers to recalculate record totals
            const workers = window.currentModalWorkers || [];
            
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
            alert('حدث خطأ أثناء الحذف');
        }
    }

        async updateRecordStatus(recordId, status, btn = null) {
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        }
        try {
            const record = await db.getById('records', recordId);
            if (record) {
                let prefix = window.currentCardPrefix || 'card';
                if (status === 'approved') {
                    let newTotalAmount = 0;
                    // Fetch actual workers from DB to be safe
                    const workers = window.currentModalWorkers || [];

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
                
                alert(`تم ${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح`);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
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
    
    async highlightRecordFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewRecordId = urlParams.get('view_record');
        if (!viewRecordId) return;

        // Reset URL so it doesn't happen again on normal navigation
        window.history.replaceState({}, document.title, "/");

        try {
            const role = auth.getRole();
            if (!role) return;

            // Fetch record to know its date and status
            const res = await db.request('/api/recordDetails?id=' + viewRecordId);
            if (!res.ok) return;
            const data = await res.json();
            const record = data.record;

            if (role === 'admin' || role === 'engineer') {
                if (role === 'admin') {
                    UI.showView('view-engineer');
                    document.querySelectorAll('#nav-links a').forEach(l => l.classList.remove('active'));
                    const targetLink = document.querySelector('a[data-view="view-engineer"]');
                    if (targetLink) targetLink.classList.add('active');
                }
                
                // Adjust filters to match the record so it appears in the DOM
                const dateInput = document.getElementById('engineer-date-filter');
                const statusInput = document.getElementById('engineer-status-filter');
                
                if (dateInput) dateInput.value = record.date;
                if (statusInput) statusInput.value = 'all'; // Show it regardless of status
                
                // Fetch and render records again to ensure it is in the DOM
                const records = await db.getRecordsWithDetails(null, null, role === 'admin' ? null : auth.currentUser.id, { start: record.date, end: record.date });
                UI.renderEngineerRecords(records, role);
            } else if (role === 'supervisor') {
                UI.showView('view-supervisor');
                document.querySelectorAll('#nav-links a').forEach(l => l.classList.remove('active'));
                const targetLink = document.querySelector('a[data-view="view-supervisor"]');
                if (targetLink) targetLink.classList.add('active');
                // loadSupervisorData already loads everything
            }

            // Wait a moment for DOM to paint
            setTimeout(() => {
                const activeView = document.querySelector('.view:not(.hidden)'); const target = activeView ? activeView.querySelector('#record-card-' + viewRecordId) : document.getElementById('record-card-' + viewRecordId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add glowing rectangle effect
                    target.style.transition = "all 0.5s ease";
                    target.style.boxShadow = "0 0 20px 5px #ffd700";
                    target.style.border = "3px solid #ffd700";
                    target.style.transform = "scale(1.02)";
                    
                    // Revert scale after 1 second, but keep glow for 5 seconds
                    setTimeout(() => {
                        target.style.transform = "scale(1)";
                    }, 1000);
                    setTimeout(() => {
                        target.style.boxShadow = "var(--shadow)";
                        target.style.border = "none";
                    }, 5000);
                }
            }, 100);

        } catch (e) {
            console.error(e);
        }
    }


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


// --- Modal Scheduled Logic ---
document.body.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-scheduled')) {
        const m = document.getElementById('modal-scheduled');
        if (m) m.style.display = 'flex';
    }
});


// Role filters for broadcast dropdown
document.body.addEventListener('change', (e) => {
    if (e.target.classList.contains('role-filter-cb')) {
        const role = e.target.value;
        const isChecked = e.target.checked;
        
        // Uncheck 'all' if we are touching specific roles
        document.getElementById('broadcast-target-all').checked = false;
        
        const userCbs = document.querySelectorAll('.broadcast-user-checkbox');
        userCbs.forEach(cb => {
            const row = cb.closest('label');
            if (row && row.querySelector('.badge') && row.querySelector('.badge').getAttribute('data-role') === role) {
                cb.checked = isChecked;
            }
        });
        
        // Trigger title update
        if (window.app && window.app.updateMultiselectTitle) window.app.updateMultiselectTitle();
    }
});

// Initialize App
window.app = new App();

        // --- Theme Toggle Logic ---
        const themeCheckbox = document.getElementById('theme-checkbox');
        const themeSliderCircle = document.querySelector('.theme-slider-circle');
        const themeSlider = document.querySelector('.theme-slider');
        
        const applyTheme = (isLight) => {
            if (isLight) {
                document.body.classList.add('light-mode');
                if (themeCheckbox) themeCheckbox.checked = true;
                if (themeSliderCircle) themeSliderCircle.style.transform = 'translateX(22px)';
                if (themeSlider) themeSlider.style.backgroundColor = '#4f46e5';
            } else {
                document.body.classList.remove('light-mode');
                if (themeCheckbox) themeCheckbox.checked = false;
                if (themeSliderCircle) themeSliderCircle.style.transform = 'translateX(0)';
                if (themeSlider) themeSlider.style.backgroundColor = 'var(--border-color)';
            }
        };

        const currentTheme = localStorage.getItem('app-theme') || 'dark';
        applyTheme(currentTheme === 'light');
        
        if (themeCheckbox) {
            themeCheckbox.addEventListener('change', (e) => {
                const isLight = e.target.checked;
                localStorage.setItem('app-theme', isLight ? 'light' : 'dark');
                applyTheme(isLight);
            });
        }


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
        window.app.deleteRecord(recordId, deleteBtn);
        return;
    }
});

    if (window.PullToRefresh) {
        PullToRefresh.init({
            mainElement: 'body',
            instructionsPullToRefresh: 'اسحب للأسفل للتحديث',
            instructionsReleaseToRefresh: 'أفلت للتحديث',
            instructionsRefreshing: 'جاري التحديث...',
            onRefresh() {
                window.location.reload();
            }
        });
    }


</script>
<!-- Draggable Refresh Button -->
<div id="draggable-refresh-btn" style="position: fixed; top: 15px; left: 15px; background: var(--primary-color); border: none; color: white; border-radius: 50%; width: 34px; height: 34px; font-size: 0.9rem; cursor: grab; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-lg); z-index: 10000; touch-action: none; transition: transform 0.1s;">
    <i class="fas fa-sync-alt"></i>
</div>
<script>
    (function() {
        const btn = document.getElementById('draggable-refresh-btn');
        let isDragging = false;
        let hasDragged = false;
        let startX, startY, initialX, initialY;

        // Load saved position
        const savedPos = localStorage.getItem('labor_app_refresh_btn_pos');
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            btn.style.left = pos.left;
            btn.style.top = pos.top;
        }

        function startDrag(e) {
            isDragging = true;
            hasDragged = false;
            btn.style.cursor = 'grabbing';
            btn.style.transform = 'scale(1.1)';
            
            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            
            initialX = btn.offsetLeft;
            initialY = btn.offsetTop;
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            let currentX, currentY;
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

            const dx = currentX - startX;
            const dy = currentY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
            }

            btn.style.left = (initialX + dx) + 'px';
            btn.style.top = (initialY + dy) + 'px';
        }

        function stopDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            btn.style.cursor = 'grab';
            btn.style.transform = 'scale(1)';
            
            if (!hasDragged) {
                // If it was just a click (no drag), do the refresh
                btn.querySelector('i').classList.add('fa-spin');
                window.location.reload();
            } else {
                // Save new position
                localStorage.setItem('labor_app_refresh_btn_pos', JSON.stringify({
                    left: btn.style.left,
                    top: btn.style.top
                }));
            }
        }

        btn.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', drag, { passive: false });
        window.addEventListener('mouseup', stopDrag);

        btn.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('touchmove', drag, { passive: false });
        window.addEventListener('touchend', stopDrag);
    })();
</script>

<script>
    window.printWorkerReceipts = function() {
        const rows = Array.from(document.querySelectorAll('#report-results-list tr'));
        const visibleRows = rows.filter(r => r.style.display !== 'none');
        
        if (visibleRows.length === 0 || visibleRows[0].cells.length === 1) {
            alert('لا توجد بيانات للطباعة');
            return;
        }
        
        const workerStats = {};
        
        visibleRows.forEach(row => {
            const name = row.cells[0].innerText.trim();
            const type = row.cells[1].innerText.trim();
            const date = row.cells[3].innerText.trim();
            const grossAmount = parseFloat(row.cells[4].innerText.replace(/,/g, '').trim()) || 0;
            const deduction = parseFloat(row.cells[5].innerText.replace(/,/g, '').trim()) || 0;
            const netAmount = parseFloat(row.cells[6].innerText.replace(/,/g, '').trim()) || 0;
            const location = row.cells[8] ? row.cells[8].innerText.trim() : '';
            const notes = row.cells[9] ? row.cells[9].innerText.trim() : '';
            
            if (!workerStats[name]) {
                workerStats[name] = { days: 0, totalNet: 0, records: [] };
            }
            workerStats[name].days += 1;
            workerStats[name].totalNet += netAmount;
            workerStats[name].records.push({
                type: type,
                date: date,
                gross: grossAmount,
                deduction: deduction,
                net: netAmount,
                location: location,
                notes: notes
            });
        });
        
        let printHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>سركي العامل</title>
            <base href="\${window.location.origin}">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                @media print {
                    @page { margin: 0.5cm; size: landscape; }
                    .receipt-page { page-break-after: always; }
                    .receipt-page:last-child { page-break-after: auto; }
                }
                body { font-family: 'Cairo', sans-serif, Arial; margin: 0; padding: 0; background: #fff; color: #000; }
                .receipt-page { 
                    width: 100%; 
                    padding: 15px; 
                    box-sizing: border-box; 
                    display: flex;
                    flex-direction: column;
                    min-height: 95vh;
                }
                .header { position: relative; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .header h1 { margin: 8px 0; font-size: 24px; font-weight: bold; }
                .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
                .project-title-box {
                    background-color: #eef5fb;
                    color: #003366;
                    padding: 8px 20px;
                    border-radius: 6px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0;
                    border: 1px solid #b8d4f0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .header p { margin: 0; font-size: 14px; }
                .logo-img { position: absolute; right: 0; top: 0; max-height: 60px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 11px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; word-wrap: break-word; }
                th { background-color: #eee; font-weight: bold; }
                
                .summary { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; font-weight: bold; border: 1px solid #000; padding: 6px; background: #fafafa;}
                
                .signatures { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: auto; 
                    padding-top: 10px; 
                }
                .sig-box { 
                    text-align: center; 
                    width: 15%; 
                    font-size: 12px; 
                    font-weight: bold; 
                }
                .sig-line { 
                    border-bottom: 1px solid #000; 
                    margin-top: 30px; 
                }
            </style>
        </head>
        <body>
        `;
        
        const dateRange = document.getElementById('print-date-range').innerText;
        
        for (const [name, stats] of Object.entries(workerStats)) {
            stats.records.sort((a, b) => a.date.localeCompare(b.date));
            
            let recordsHtml = '<table><thead><tr><th>م</th><th>الاسم</th><th>النوع</th><th>التاريخ</th><th>المشروع</th><th>مكان العمل</th><th>الملاحظات</th><th>سعر الساعة</th><th>ساعات العمل</th><th>خصم</th><th>صافية اليومية</th></tr></thead><tbody>';
            stats.records.forEach((r, index) => {
                recordsHtml += '<tr>';
                // Serial
                recordsHtml += `<td>${index + 1}</td>`;
                
                // Name (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">${name}</td>`;
                }
                
                // Type (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-size: 12px;">${r.type}</td>`;
                }
                
                // Date
                recordsHtml += `<td>${r.date}</td>`;
                
                // Project (rowspan)
                if (index === 0) {
                    recordsHtml += `<td rowspan="${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 13px;">The Curve</td>`;
                }
                
                // Location
                recordsHtml += `<td>${r.location}</td>`;
                
                // Notes
                recordsHtml += `<td>${r.notes}</td>`;
                
                // Hourly Rate (Gross / 8)
                const hourlyRate = (r.gross / 8).toFixed(2);
                recordsHtml += `<td>${hourlyRate}</td>`;
                
                // Working Hours
                recordsHtml += `<td>8</td>`;
                
                // Deduction
                recordsHtml += `<td>${r.deduction}</td>`;
                
                // Net Amount
                recordsHtml += `<td>${r.net}</td>`;
                
                recordsHtml += '</tr>';
            });
            recordsHtml += '</tbody></table>';
            
            printHtml += `
            <div class="receipt-page">
                <div class="header">
                    <img src="/logo.png?v=2" class="logo-img" alt="Logo">
                    <div class="project-title-box">Cornerstone Development - Project: The Curve</div>
                    <h1>سركي العامل</h1>
                    <p>${dateRange}</p>
                </div>
                
                ${recordsHtml}
                
                <div class="summary">
                    <div>إجمالي عدد اليوميات: ${stats.days} يوم</div>
                    <div>إجمالي المبلغ المستحق: ${stats.totalNet.toLocaleString()} جنيه</div>
                </div>
                
                <div class="signatures">
                    <div class="sig-box">
                        <div>العامل</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مشرف البند</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مهندس البند</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>محاسب المشروع</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>مدير المشروع</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div>المدير المالي</div>
                        <div class="sig-line"></div>
                    </div>
                </div>
            </div>
            `;
        }
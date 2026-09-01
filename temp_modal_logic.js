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
                const engineers = (window.app && window.app.users) ? window.app.users.filter(u => u.role === 'engineer' && u.id !== window.app.currentUser.id) : [];
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
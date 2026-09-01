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
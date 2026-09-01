const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldUpdate = `    async updateRecordStatus(recordId, status, btn = null) {
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        }
        const record = await db.getById('records', recordId);
        if (record) {
            let prefix = window.currentCardPrefix || 'card';
            if (status === 'approved') {
                let newTotalAmount = 0;
                let prefix = window.currentCardPrefix || 'card';
                // Fetch actual workers from DB to be safe
                const workers = window.currentModalWorkers || [];

                let updatePromises = [];
                for (let worker of workers) {
                    const typeInput = document.getElementById(\`\${prefix}-type-\${worker.id}\`);
                    const amountInput = document.getElementById(\`\${prefix}-amount-\${worker.id}\`);
                    const locationInput = document.getElementById(\`\${prefix}-location-\${worker.id}\`);
                    const deductionInput = document.getElementById(\`\${prefix}-deduction-\${worker.id}\`);
                    const notesInput = document.getElementById(\`\${prefix}-notes-\${worker.id}\`);
                    
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
            
            alert(\`تم \${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح\`);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    }`;

content = content.replace(/async updateRecordStatus\(recordId, status, btn = null\) \{[\s\S]*?if \(btn\) \{\s*btn\.disabled = false;\s*btn\.innerHTML = origHtml;\s*\}\s*\}\s*\}/, "");

const newUpdate = `    async updateRecordStatus(recordId, status, btn = null) {
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
                        const typeInput = document.getElementById(\`\${prefix}-type-\${worker.id}\`);
                        const amountInput = document.getElementById(\`\${prefix}-amount-\${worker.id}\`);
                        const locationInput = document.getElementById(\`\${prefix}-location-\${worker.id}\`);
                        const deductionInput = document.getElementById(\`\${prefix}-deduction-\${worker.id}\`);
                        const notesInput = document.getElementById(\`\${prefix}-notes-\${worker.id}\`);
                        
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
                
                alert(\`تم \${status === 'approved' ? 'اعتماد' : 'رفض'} السركي بنجاح\`);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    }`;

const oldDelete = `    async deleteRecord(recordId) {
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
    }`;

const newDelete = `    async deleteRecord(recordId, btn = null) {
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
    }`;

// First restore original state if it's messed up, or just overwrite it normally.
let finalContent = content;

// If oldUpdate is not matched because of some spaces, we can just replace everything from `async updateRecordStatus` to `    async generateReport()`
finalContent = finalContent.replace(/async updateRecordStatus\(recordId, status[\s\S]*?\/\/ --- Reports Functions ---/, newUpdate + '\n    // --- Reports Functions ---');

finalContent = finalContent.replace(/async deleteRecord\(recordId\) \{[\s\S]*?\}\s*catch\s*\(error\)\s*\{\s*console\.error\(error\);\s*alert\('حدث خطأ أثناء المسح'\);\s*\}\s*\}/, newDelete);

fs.writeFileSync("index.html", finalContent);
console.log("Successfully rewrote methods");

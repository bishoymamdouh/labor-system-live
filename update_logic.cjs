const fs = require('fs');
let js = fs.readFileSync('temp_modal_logic.js', 'utf8');

const newButtonLogic = `
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
        
        modal.classList.remove('hidden');`;

// Replace the old button logic
const regex = /if\s*\(readOnly \|\| record\.status !== 'pending'\) \{[\s\S]*?modal\.classList\.remove\('hidden'\);/;
js = js.replace(regex, newButtonLogic);
fs.writeFileSync('temp_modal_logic.js', js, 'utf8');
console.log("temp_modal_logic.js updated!");

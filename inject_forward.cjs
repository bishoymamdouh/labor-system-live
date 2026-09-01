const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const forwardMethod = `
    async forwardRecord(recordId, supervisorName, btn) {
        const select = document.getElementById('forward-eng-' + recordId);
        const forwardEng = select ? select.value : null;
        
        if (!forwardEng) {
            alert('يرجى اختيار مهندس لتحويل الطلب إليه');
            return;
        }
        
        let origHtml = btn.innerHTML;
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            
            const record = await this.db.getById('records', recordId);
            if (!record) throw new Error("Record not found");
            
            record.engineerId = forwardEng;
            record.forwardedBy = auth.currentUser.username || auth.currentUser.name;
            
            await this.db.update('records', recordId, record);
            
            await fetch('/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: 'طلب اعتماد محول', 
                    message: 'تم تحويل طلب اعتماد إليك من المهندس ' + (auth.currentUser.username || auth.currentUser.name) + ' (المرسل الأصلي: ' + (supervisorName || '') + ')', 
                    target: [forwardEng] 
                })
            });
            
            alert('تم تحويل الطلب بنجاح');
            
            const role = auth.getRole();
            if (role === 'admin') {
                await this.loadAdminData();
                await this.loadEngineerData();
                await this.generateReport();
            } else if (role === 'engineer') {
                await this.loadEngineerData();
                await this.generateReport();
            }
            
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء التحويل');
        } finally {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
`;

// Insert it right before "async updateRecordStatus"
const target = 'async updateRecordStatus(recordId, status, btn = null) {';
if (html.includes(target)) {
    html = html.replace(target, forwardMethod + '\n    ' + target);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("forwardRecord method added!");
} else {
    console.log("Could not find updateRecordStatus to insert before");
}

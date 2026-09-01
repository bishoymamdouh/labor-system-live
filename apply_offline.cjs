const fs = require("fs");
try {
    let content = fs.readFileSync("index.html", "utf8");
    
    // 1. Inject sync function into App class
    const syncFunc = `
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
    
    attachEventListeners() {`;
    
    content = content.replace("attachEventListeners() {", syncFunc);
    
    // 2. Add online event listener
    const onlineListener = `
        window.addEventListener('online', () => this.syncOfflineRecords());
        setTimeout(() => this.syncOfflineRecords(), 3000); // Also try on startup
        
        const logoutBtn = document.getElementById('logout-btn');`;
    content = content.replace("const logoutBtn = document.getElementById('logout-btn');", onlineListener);
    
    // 3. Update catch block in submitRecord
    const catchRegex = /} catch \(error\) {[\s\S]*?alert\('[^']*'\);[\s\S]*?}/;
    const newCatch = `} catch (error) {
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
        }`;
    content = content.replace(catchRegex, newCatch);
    
    fs.writeFileSync("index.html", content);
    console.log("Success");
} catch(e) {
    console.log("Error: " + e.message);
}

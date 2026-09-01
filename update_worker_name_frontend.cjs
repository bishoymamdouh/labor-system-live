const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldSave = `    async saveDirWorker(id) {
        const newName = document.getElementById(\`edit-dir-name-\${id}\`).value.trim();
        const newType = document.getElementById(\`edit-dir-type-\${id}\`).value;
        const newAmount = document.getElementById(\`edit-dir-amount-\${id}\`).value;
        
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
    }`;

const newSave = `    async saveDirWorker(id) {
        const newName = document.getElementById(\`edit-dir-name-\${id}\`).value.trim();
        const newType = document.getElementById(\`edit-dir-type-\${id}\`).value;
        const newAmount = document.getElementById(\`edit-dir-amount-\${id}\`).value;
        
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
            
            // Show loading icon or similar
            const btn = document.querySelector(\`#dir-worker-row-\${id} .dir-col-actions button.btn-success\`);
            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // 1. Update the directory
            await db.update('worker_directory', id, worker);
            
            // 2. If name changed, update ALL historical records in the background
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
    }`;

content = content.replace(oldSave, newSave);
fs.writeFileSync("index.html", content);
console.log("Updated saveDirWorker to update historical records");

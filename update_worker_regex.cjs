const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /async saveDirWorker\(id\) \{[\s\S]*?this\.loadAdminData\(\);\s*\}\s*\}/,
    `async saveDirWorker(id) {
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
            
            const btn = document.querySelector(\`#dir-worker-row-\${id} .dir-col-actions button.text-success\`);
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
    }`
);

fs.writeFileSync("index.html", content);
console.log("Regex replacement done.");

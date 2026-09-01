const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldCode = `                // Fetch actual workers from DB to be safe
                const workersRes = await fetch('/api/allRecordsDetails?t=' + Date.now(), {cache: 'no-store'});
                const allRecs = await workersRes.json();
                const currentRec = allRecs.find(r => String(r.id) === String(recordId));
                const workers = currentRec ? currentRec.workers : [];`;

const newCode = `                // Fetch actual workers from local DB
                const allWorkers = await db.getAll('workers');
                const workers = allWorkers.filter(w => String(w.recordId) === String(recordId) && !w.isDeleted);`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("index.html", content);
console.log("Fixed updateRecordStatus to use local DB");

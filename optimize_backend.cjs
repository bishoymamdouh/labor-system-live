const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const oldEndpoint = `        if (collection === "allRecordsDetails" && method === "GET") {
            const recordsEntries = kv.list({ prefix: ["records"] });
            const records = [];
            for await (const r of recordsEntries) {
                records.push({ id: r.key[1], ...r.value });
            }

            const usersEntries = kv.list({ prefix: ["users"] });
            const users = [];
            for await (const u of usersEntries) {
                users.push({ id: u.key[1], ...u.value });
            }

            const workersEntries = kv.list({ prefix: ["workers"] });
            const workers = [];
            for await (const w of workersEntries) {
                workers.push({ id: w.key[1], ...w.value });
            }
            
            // Map users
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u.username);
            
            // Group workers
            const workersByRecord = {};
            workers.forEach(w => {
                if (!workersByRecord[w.recordId]) workersByRecord[w.recordId] = [];
                workersByRecord[w.recordId].push(w);
            });
            
            // Attach details to records
            const detailedRecords = records.map(r => {
                const recordWorkers = workersByRecord[r.id] || [];
                const validWorkers = recordWorkers.filter(w => !w.isDeleted);
                return {
                    ...r,
                    supervisorName: usersMap[r.supervisorId] || 'غير معروف',
                    engineerName: usersMap[r.engineerId] || 'غير محدد',
                    workers: validWorkers,
                    workerCount: validWorkers.length
                };
            });
            
            return new Response(JSON.stringify(detailedRecords), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }`;

const newEndpoint = `        if (collection === "allRecordsDetails" && method === "GET") {
            const filterStatus = url.searchParams.get("status");
            const filterSupervisor = url.searchParams.get("supervisorId");
            const filterEngineer = url.searchParams.get("engineerId");
            const filterDateStart = url.searchParams.get("dateStart");
            const filterDateEnd = url.searchParams.get("dateEnd");

            const recordsEntries = kv.list({ prefix: ["records"] });
            let records = [];
            for await (const r of recordsEntries) {
                let rec = { id: r.key[1], ...r.value };
                
                if (filterStatus && rec.status !== filterStatus) continue;
                if (filterSupervisor && String(rec.supervisorId) !== String(filterSupervisor)) continue;
                if (filterEngineer && String(rec.engineerId) !== String(filterEngineer)) continue;
                if (filterDateStart && filterDateEnd) {
                    if (rec.date < filterDateStart || rec.date > filterDateEnd) continue;
                }
                
                records.push(rec);
            }

            const recordIds = new Set(records.map(r => String(r.id)));

            const usersEntries = kv.list({ prefix: ["users"] });
            const users = [];
            for await (const u of usersEntries) {
                users.push({ id: u.key[1], ...u.value });
            }

            const workersEntries = kv.list({ prefix: ["workers"] });
            const workers = [];
            for await (const w of workersEntries) {
                if (recordIds.has(String(w.value.recordId))) {
                    workers.push({ id: w.key[1], ...w.value });
                }
            }
            
            // Map users
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u.username);
            
            // Group workers
            const workersByRecord = {};
            workers.forEach(w => {
                if (!workersByRecord[w.recordId]) workersByRecord[w.recordId] = [];
                workersByRecord[w.recordId].push(w);
            });
            
            // Attach details to records
            const detailedRecords = records.map(r => {
                const recordWorkers = workersByRecord[r.id] || [];
                const validWorkers = recordWorkers.filter(w => !w.isDeleted);
                return {
                    ...r,
                    supervisorName: usersMap[r.supervisorId] || 'غير معروف',
                    engineerName: usersMap[r.engineerId] || 'غير محدد',
                    workers: validWorkers,
                    workerCount: validWorkers.length
                };
            });
            
            return new Response(JSON.stringify(detailedRecords), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }`;

content = content.replace(oldEndpoint, newEndpoint);
fs.writeFileSync("server.ts", content);
console.log("Optimized allRecordsDetails on backend");

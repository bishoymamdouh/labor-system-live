const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldFunc = `    async getRecordsWithDetails(filterStatus = null, supervisorId = null, engineerId = null, dateRange = null) {
        let res = await this.request('/api/allRecordsDetails');
        let records = await res.json();
        
        if (filterStatus) records = records.filter(r => r.status === filterStatus);
        if (supervisorId) records = records.filter(r => String(r.supervisorId) === String(supervisorId));
        if (engineerId) records = records.filter(r => String(r.engineerId) === String(engineerId));

        if (dateRange && dateRange.start && dateRange.end) {
            records = records.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
        }

        return records.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            
            const createdB = b.createdAt ? new Date(b.createdAt) : 0;
            const createdA = a.createdAt ? new Date(a.createdAt) : 0;
            return createdB - createdA;
        });
    }`;

const newFunc = `    async getRecordsWithDetails(filterStatus = null, supervisorId = null, engineerId = null, dateRange = null) {
        let url = '/api/allRecordsDetails?';
        if (filterStatus) url += \`status=\${encodeURIComponent(filterStatus)}&\`;
        if (supervisorId) url += \`supervisorId=\${encodeURIComponent(supervisorId)}&\`;
        if (engineerId) url += \`engineerId=\${encodeURIComponent(engineerId)}&\`;
        if (dateRange && dateRange.start && dateRange.end) {
            url += \`dateStart=\${encodeURIComponent(dateRange.start)}&dateEnd=\${encodeURIComponent(dateRange.end)}&\`;
        }
        
        let res = await this.request(url);
        let records = await res.json();

        return records.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            
            const createdB = b.createdAt ? new Date(b.createdAt) : 0;
            const createdA = a.createdAt ? new Date(a.createdAt) : 0;
            return createdB - createdA;
        });
    }`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync("index.html", content);
console.log("Optimized db.getRecordsWithDetails on frontend");

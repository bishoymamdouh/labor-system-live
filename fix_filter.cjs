const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethod = html.match(/    async loadEngineerData\(\) \{[\s\S]*?UI\.renderEngineerRecords\(records, role\);\r?\n    \}/);
if (targetMethod) {
    const newMethod = `    async loadEngineerData() {
        const role = auth.getRole();
        const engineerId = role === 'admin' ? null : auth.currentUser.id;
        
        let filterStatus = null;
        const filterSelect = document.getElementById('engineer-status-filter');
        if (filterSelect && filterSelect.value !== 'all') {
            filterStatus = filterSelect.value;
        }

        let filterDate = null;
        const dateInput = document.getElementById('engineer-date-filter');
        if (dateInput && dateInput.value) {
            filterDate = dateInput.value;
        }

        let dateRange = null;
        if (filterDate) {
            dateRange = { start: filterDate, end: filterDate };
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, dateRange);
        UI.renderEngineerRecords(records, role);
    }`;
    html = html.replace(targetMethod[0], newMethod);
    fs.writeFileSync('index.html', html);
    console.log("Fixed getRecordsWithDetails call in loadEngineerData");
} else {
    console.log("Regex for loadEngineerData did not match");
}

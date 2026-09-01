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

        const records = await db.getRecordsWithDetails(filterStatus, filterDate, engineerId, null);
        UI.renderEngineerRecords(records, role);
    }`;
    html = html.replace(targetMethod[0], newMethod);
    console.log("Updated loadEngineerData");
} else {
    console.log("Regex for loadEngineerData did not match");
}
fs.writeFileSync('index.html', html);

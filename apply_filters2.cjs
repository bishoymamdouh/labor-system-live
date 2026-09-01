const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Update loadEngineerData
const targetMethod = html.match(/    async loadEngineerData\(\) \{[\s\S]*?UI\.renderEngineerRecords\(records, role\);\n    \}/);
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
}

// Update the select element
const targetSelectBlock = html.match(/<select id="engineer-status-filter"[\s\S]*?<\/select>/);
if (targetSelectBlock) {
    let block = targetSelectBlock[0];
    block = block.replace('value="all" selected', 'value="all"');
    block = block.replace('value="pending"', 'value="pending" selected');
    
    const inputDateHtml = `\n                        <input type="date" id="engineer-date-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px;" onchange="app.loadEngineerData()">`;
    
    html = html.replace(targetSelectBlock[0], block + inputDateHtml);
    console.log("Updated engineer-status-filter and added date filter");
}

fs.writeFileSync('index.html', html);

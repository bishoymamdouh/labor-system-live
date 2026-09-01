const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the select dropdown
const oldSelect = <select id="engineer-status-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px;" onchange="app.loadEngineerData()">
                            <option value="all" selected>????</option>
                            <option value="pending">??? ????????</option>
                            <option value="approved">?????</option>
                            <option value="rejected">?????</option>
                        </select>;

const newSelect = <select id="engineer-status-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px;" onchange="app.loadEngineerData()">
                            <option value="all">????</option>
                            <option value="pending" selected>??? ????????</option>
                            <option value="approved">?????</option>
                            <option value="rejected">?????</option>
                        </select>
                        <input type="date" id="engineer-date-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px;" onchange="app.loadEngineerData()">;

if (html.includes(oldSelect)) {
    html = html.replace(oldSelect, newSelect);
} else {
    console.error("Could not find the select block");
}

// 2. Replace the loadEngineerData method
const oldMethod =     async loadEngineerData() {
        const role = auth.getRole();
        const engineerId = role === 'admin' ? null : auth.currentUser.id;
        
        let filterStatus = null;
        const filterSelect = document.getElementById('engineer-status-filter');
        if (filterSelect && filterSelect.value !== 'all') {
            filterStatus = filterSelect.value;
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, null);
        UI.renderEngineerRecords(records, role);
    };

const newMethod =     async loadEngineerData() {
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
    };

if (html.includes(oldMethod)) {
    html = html.replace(oldMethod, newMethod);
} else {
    console.error("Could not find the method block");
}

fs.writeFileSync('index.html', html);
console.log("Successfully modified index.html");

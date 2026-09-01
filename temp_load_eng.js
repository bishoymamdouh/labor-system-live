async loadEngineerData() {
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
            filterDate = { start: dateInput.value, end: dateInput.value };
        }

        const records = await db.getRecordsWithDetails(filterStatus, null, engineerId, filterDate);
        UI.renderEngineerRecords(records, role);
        this.highlightRecordFromURL();
    }
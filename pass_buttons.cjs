const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /app\.updateRecordStatus\('([^']+)', 'approved'\)/g,
    "app.updateRecordStatus('$1', 'approved', this)"
);

content = content.replace(
    /app\.updateRecordStatus\('([^']+)', 'rejected'\)/g,
    "app.updateRecordStatus('$1', 'rejected', this)"
);

content = content.replace(
    /window\.app\.deleteRecord\(recordId\);/g,
    "window.app.deleteRecord(recordId, deleteBtn);"
);

content = content.replace(
    /app\.updateRecordStatus\(record\.id, 'approved'\);/g,
    "app.updateRecordStatus(record.id, 'approved', document.getElementById('approve-record-btn'));"
);

content = content.replace(
    /app\.updateRecordStatus\(record\.id, 'rejected'\);/g,
    "app.updateRecordStatus(record.id, 'rejected', document.getElementById('reject-record-btn'));"
);

fs.writeFileSync("index.html", content);
console.log("Updated onclick handlers to pass button");

const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');
console.log('view-admin:', lines.findIndex(l => l.includes('<section id="view-admin"')));
console.log('view-notifications:', lines.findIndex(l => l.includes('<section id="view-notifications"')));
console.log('view-reports:', lines.findIndex(l => l.includes('<section id="view-reports"')));
console.log('modal-scheduled:', lines.findIndex(l => l.includes('id="modal-scheduled"')));

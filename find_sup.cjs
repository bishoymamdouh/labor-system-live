const fs = require("fs");
const lines = fs.readFileSync("index_backup_pre_offline.html", "utf8").split('\n');
const supervisorIdx = lines.findIndex(l => l.includes('<section id="view-supervisor"'));
console.log(lines.slice(supervisorIdx - 20, supervisorIdx + 10).map((l, i) => (supervisorIdx - 20 + i + 1) + ': ' + l).join('\n'));

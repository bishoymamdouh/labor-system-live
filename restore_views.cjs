const fs = require("fs");
const oldLines = fs.readFileSync("index_backup_pre_offline.html", "utf8").split('\n');

const supStart = oldLines.findIndex(l => l.includes('<section id="view-supervisor"'));
const engStart = oldLines.findIndex(l => l.includes('<section id="view-engineer"'));
const repStart = oldLines.findIndex(l => l.includes('<section id="view-reports"'));

const missingHtml = oldLines.slice(supStart, repStart).join('\n');

const currentLines = fs.readFileSync("index.html", "utf8").split('\n');
const insertIdx = currentLines.findIndex(l => l.includes('<section id="view-notifications"'));

currentLines.splice(insertIdx, 0, missingHtml);
fs.writeFileSync("index.html", currentLines.join('\n'));
console.log("Restored missing views!");

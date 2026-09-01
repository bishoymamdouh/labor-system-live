const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");
content = content.replace(
    "const location = row.getAttribute('data-location') || '';",
    "const location = row.cells[8] ? row.cells[8].innerText.trim() : '';"
);
fs.writeFileSync("index.html", content);
console.log("Updated printWorkerReceipts to read location from column 8");

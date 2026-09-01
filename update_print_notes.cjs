const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// Extract notes
content = content.replace(
    /const location = row\.cells\[8\] \? row\.cells\[8\]\.innerText\.trim\(\) : '';/,
    "const location = row.cells[8] ? row.cells[8].innerText.trim() : '';\n            const notes = row.cells[9] ? row.cells[9].innerText.trim() : '';"
);

// Push notes to record
content = content.replace(
    /location: location\n\s*\}\);/,
    "location: location,\n                notes: notes\n            });"
);

// Add to table headers
content = content.replace(
    "<th>مكان العمل</th><th>سعر الساعة</th>",
    "<th>مكان العمل</th><th>الملاحظات</th><th>سعر الساعة</th>"
);

// Add to table rows
content = content.replace(
    "// Location\n                recordsHtml += `<td>${r.location}</td>`;\n                \n                // Hourly Rate",
    "// Location\n                recordsHtml += `<td>${r.location}</td>`;\n                \n                // Notes\n                recordsHtml += `<td>${r.notes}</td>`;\n                \n                // Hourly Rate"
);

fs.writeFileSync("index.html", content);
console.log("Added Notes to print worker receipts");

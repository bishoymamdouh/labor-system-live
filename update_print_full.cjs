const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// Extract type from column 1 and location from column 8
content = content.replace(
    /const date = row\.cells\[3\]\.innerText\.trim\(\);/,
    "const type = row.cells[1].innerText.trim();\n            const date = row.cells[3].innerText.trim();"
);

content = content.replace(
    "const location = row.getAttribute('data-location') || '';",
    "const location = row.cells[8] ? row.cells[8].innerText.trim() : '';"
);

// Add type to the pushed record
content = content.replace(
    "date: date,",
    "date: date,\n                type: type,"
);

// Update print headers
content = content.replace(
    "<tr><th>م</th><th>الاسم</th><th>التاريخ</th><th>المشروع</th><th>مكان العمل</th><th>سعر الساعة</th><th>ساعات العمل</th><th>خصم</th><th>صافية اليومية</th></tr>",
    "<tr><th>م</th><th>الاسم</th><th>النوع</th><th>التاريخ</th><th>المشروع</th><th>مكان العمل</th><th>سعر الساعة</th><th>ساعات العمل</th><th>خصم</th><th>صافية اليومية</th></tr>"
);

// Add the Type column to the print rows with rowspan
content = content.replace(
    "// Date",
    "// Type (rowspan)\n                if (index === 0) {\n                    recordsHtml += `<td rowspan=\"${stats.records.length}\" style=\"vertical-align: middle; font-size: 12px;\">${r.type}</td>`;\n                }\n                \n                // Date"
);

fs.writeFileSync("index.html", content);
console.log("Updated printWorkerReceipts with Type and Location columns");

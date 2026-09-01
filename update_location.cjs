const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '<tr>\n                            <td><strong>${w.name}</strong></td>',
    '<tr data-location="${w.location || \'\'}">\n                            <td><strong>${w.name}</strong></td>'
);

content = content.replace(
    `let recordsHtml = '<table><thead><tr><th>اسم العامل</th><th>النوع</th><th>التاريخ</th><th>الصافي (جنيه)</th><th>الملاحظات</th></tr></thead><tbody>';
            stats.records.forEach((r, index) => {
                recordsHtml += '<tr>';
                if (index === 0) {
                    recordsHtml += \`<td rowspan="\${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 14px;">\${r.name}</td>\`;
                }
                recordsHtml += \`
                    <td>\${r.type}</td>
                    <td>\${r.date}</td>
                    <td>\${r.amount}</td>
                    <td>\${r.notes}</td>
                </tr>\`;
            });`,
    `let recordsHtml = '<table><thead><tr><th>اسم العامل</th><th>النوع</th><th>مكان العمل</th><th>التاريخ</th><th>الصافي (جنيه)</th></tr></thead><tbody>';
            stats.records.forEach((r, index) => {
                recordsHtml += '<tr>';
                if (index === 0) {
                    recordsHtml += \`<td rowspan="\${stats.records.length}" style="vertical-align: middle; font-weight: bold; font-size: 14px;">\${r.name}</td>\`;
                }
                recordsHtml += \`
                    <td>\${r.type}</td>
                    <td>\${r.location}</td>
                    <td>\${r.date}</td>
                    <td>\${r.amount}</td>
                </tr>\`;
            });`
);

content = content.replace(
    `const engineer = row.cells[7].innerText.trim();
            const notes = row.cells[8].innerText.trim();
            
            if (!workerStats[name]) {`,
    `const engineer = row.cells[7].innerText.trim();
            const location = row.getAttribute('data-location') || '';
            const notes = row.cells[8].innerText.trim();
            
            if (!workerStats[name]) {`
);

content = content.replace(
    `amount: netAmountStr,
                engineer: engineer,
                notes: notes`,
    `amount: netAmountStr,
                engineer: engineer,
                location: location,
                notes: notes`
);


fs.writeFileSync("index.html", content);
console.log("Updated data-location and print template");

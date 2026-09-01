const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /let recordsHtml = '<table><thead><tr><th>اسم العامل<\/th><th>النوع<\/th><th>التاريخ<\/th><th>الصافي \(جنيه\)<\/th><th>المهندس المعتمد<\/th><th>الملاحظات<\/th><\/tr><\/thead><tbody>';\s*stats\.records\.forEach\(r => \{\s*recordsHtml \+= `<tr>\s*<td>\$\{r\.name\}<\/td>\s*<td>\$\{r\.type\}<\/td>\s*<td>\$\{r\.date\}<\/td>\s*<td>\$\{r\.amount\}<\/td>\s*<td>\$\{r\.engineer\}<\/td>\s*<td>\$\{r\.notes\}<\/td>\s*<\/tr>`;\s*\}\);\s*recordsHtml \+= '<\/tbody><\/table>';/,
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
            });
            recordsHtml += '</tbody></table>';`
);

fs.writeFileSync("index.html", content);
console.log("Updated table columns and added rowspan");

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<\/span><\/td>\s*<td>\$\{w\.notes \|\| ''\}<\/td>/,
    '</span></td>\n                            <td>${w.location || \'\'}</td>\n                            <td>${w.notes || \'\'}</td>'
);

content = content.replace(
    '<tr><td colspan="9" class="text-center">لا توجد بيانات مطابقة لفلاتر البحث</td></tr>',
    '<tr><td colspan="10" class="text-center">لا توجد بيانات مطابقة لفلاتر البحث</td></tr>'
);

fs.writeFileSync("index.html", content);
console.log("Updated row rendering");

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '<th style="color: var(--primary-color); white-space: nowrap;">المهندس المعتمد</th>\n                                    <th style="color: var(--primary-color);">الملاحظات</th>',
    '<th style="color: var(--primary-color); white-space: nowrap;">المهندس المعتمد</th>\n                                    <th style="color: var(--primary-color);">المكان</th>\n                                    <th style="color: var(--primary-color);">الملاحظات</th>'
);

content = content.replace(
    '<td colspan="4" style="text-align: left;"><strong>الإجمالي:</strong></td>',
    '<td colspan="4" style="text-align: left;"><strong>الإجمالي:</strong></td>'
);

fs.writeFileSync("index.html", content);
console.log("Updated headers");

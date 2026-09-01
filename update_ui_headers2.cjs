const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<th style="color: var\(--primary-color\);">الملاحظات<\/th>/,
    '<th style="color: var(--primary-color);">مكان العمل</th>\n                                    <th style="color: var(--primary-color);">الملاحظات</th>'
);

fs.writeFileSync("index.html", content);
console.log("Updated headers");

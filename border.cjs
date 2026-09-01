const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '#reports-table-full th, #reports-table-full td { padding: 4px 6px !important; }',
    '#reports-table-full th, #reports-table-full td { padding: 4px 6px !important; border: 1px solid var(--border-color) !important; }'
);

fs.writeFileSync("index.html", content);
console.log("Added vertical borders");

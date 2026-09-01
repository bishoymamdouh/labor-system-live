const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /await db\.getRecordsWithDetails\('all',/g,
    "await db.getRecordsWithDetails(null,"
);

fs.writeFileSync("index.html", content);
console.log("Fixed filterStatus bug");

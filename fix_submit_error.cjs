const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    "date: date,\n                type: type,\n                type: type,",
    "date: date,"
);
content = content.replace(
    "date: date,\n                type: type,",
    "date: date,"
);

fs.writeFileSync("index.html", content);
console.log("Fixed the bug in submitRecord");

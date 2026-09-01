const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /date: date,/,
    "date: date,\n                type: type,"
);

fs.writeFileSync("index.html", content);
console.log("Injected type into workerStats.records");

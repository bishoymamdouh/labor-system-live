const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

lines.splice(1048, 0, "                </div>");

fs.writeFileSync("index.html", lines.join('\n'));
console.log("Added second missing closing div");

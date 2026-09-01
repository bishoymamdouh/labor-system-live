const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

// Find and delete the extra closing div on line 1056
if (lines[1055].trim() === '</div>') {
    lines.splice(1055, 1);
}

fs.writeFileSync("index.html", lines.join('\n'));
console.log("Deleted extra closing div!");

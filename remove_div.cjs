const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

for (let i = 1150; i < 1180; i++) {
    if (lines[i] && lines[i].trim() === '/div>') {
        lines.splice(i, 1);
        console.log("Removed /div>");
        break;
    }
}
for (let i = 1150; i < 1180; i++) {
    if (lines[i] && lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].trim() === '') {
        lines.splice(i, 1);
        console.log("Removed extra </div>");
        break;
    }
}

fs.writeFileSync("index.html", lines.join('\n'));

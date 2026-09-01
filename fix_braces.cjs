const fs = require("fs");
let lines = fs.readFileSync("notifications.js", "utf8").split('\n');

// We need to find lines 188 and 189 and remove them if they are just '    }' and '});'
for (let i = 180; i < 195; i++) {
    if (lines[i] && lines[i].trim() === '}' && lines[i+1] && lines[i+1].trim() === '});') {
        lines.splice(i, 2);
        console.log("Removed broken braces!");
        break;
    }
}

fs.writeFileSync("notifications.js", lines.join('\n'));

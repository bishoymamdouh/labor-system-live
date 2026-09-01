const fs = require("fs");
let lines = fs.readFileSync("server.ts", "utf8").split('\n');

for (let i = 560; i < 600; i++) {
    if (lines[i] && lines[i].includes('checkPendingReminders(now, config);')) {
        lines[i] = '    // checkPendingReminders removed per user request';
        fs.writeFileSync("server.ts", lines.join('\n'));
        console.log("Removed checkPendingReminders call from server.ts");
        break;
    }
}

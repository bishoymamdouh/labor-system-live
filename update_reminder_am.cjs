const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    /if \(hour === 22 && lastReminderDate !== today\) {/,
    "if (hour === 10 && lastReminderDate !== today) {"
);

content = content.replace(
    /\/\/ Trigger at 10:00 PM/,
    "// Trigger at 10:00 AM"
);

fs.writeFileSync("server.ts", content);
console.log("Reverted 10 PM to 10 AM");

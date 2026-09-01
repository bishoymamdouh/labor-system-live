const fs = require("fs");
let content = fs.readFileSync("notifications.js", "utf8");

content = content.replace(
    "document.getElementById('sched-active').checked = true;",
    "document.getElementById('sched-active').checked = true;\n        if(document.getElementById('sched-role-all')) document.getElementById('sched-role-all').checked = false;\n        if(document.getElementById('sched-user-all')) document.getElementById('sched-user-all').checked = false;"
);

fs.writeFileSync("notifications.js", content);
console.log("Added reset logic");

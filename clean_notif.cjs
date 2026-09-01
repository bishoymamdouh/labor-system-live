const fs = require("fs");
let content = fs.readFileSync("notifications.js", "utf8");

content = content.replace(/const activeCb = document\.getElementById\('sys-remind-active'\);/g, '// sys-remind removed');
content = content.replace(/const textCb = document\.getElementById\('sys-remind-text'\);/g, '');
content = content.replace(/if\(activeCb\) activeCb\.checked = !!config\.systemReminder\?\.active;/g, '');
content = content.replace(/if\(textCb\) textCb\.value = config\.systemReminder\?\.message[^;]+;/g, '');

const sysSaveRegex = /if \(e\.target\.closest\('#btn-save-sys-remind'\)\) \{[\s\S]*?loadNotifData\(\);\s*\}/g;
content = content.replace(sysSaveRegex, '');

fs.writeFileSync("notifications.js", content);
console.log("Cleaned up notifications.js");

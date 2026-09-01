const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    /JSON\.stringify\(\{ title: title \|\| "(.*?)", body: message, url: "\/" \}\)/g,
    'JSON.stringify({ title: title || "$1", body: message, url: body.url || "/" })'
);

fs.writeFileSync("server.ts", content);
console.log("Updated server.ts broadcast to accept custom urls");

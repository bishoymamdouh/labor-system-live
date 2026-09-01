const fs = require("fs");
let content = fs.readFileSync("sw.js", "utf8");
content = content.replace("const CACHE_NAME = 'labor-app-v1';", "const CACHE_NAME = 'labor-app-v2';");
fs.writeFileSync("sw.js", content);
console.log("Bumped SW cache version to v2");

const fs = require("fs");
let content = fs.readFileSync("sw.js", "utf8");

content = content.replace(
    /cache\.addAll\(URLS_TO_CACHE\)/,
    `cache.addAll(URLS_TO_CACHE.map(url => url + '?v=' + Date.now()))`
);

content = content.replace("const CACHE_NAME = 'labor-app-v2';", "const CACHE_NAME = 'labor-app-v3';");
fs.writeFileSync("sw.js", content);
console.log("Updated SW with cache buster");

const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");
content = content.replace(
    'const res = await serveDir(req, {',
    `const res = await serveDir(req, {\n        headers: ["Cache-Control: no-cache, no-store, must-revalidate", "Pragma: no-cache", "Expires: 0"],`
);
fs.writeFileSync("server.ts", content);
console.log("Added no-cache headers to serveDir");

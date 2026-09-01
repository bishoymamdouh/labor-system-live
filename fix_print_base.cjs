const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");
content = content.replace(
    /<title>سركي العامل<\/title>/,
    '<title>سركي العامل</title>\n            <base href="\\${window.location.origin}">'
);
fs.writeFileSync("index.html", content);
console.log("Added base href to print html");

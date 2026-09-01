const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    "@page { margin: 0.5cm; }",
    "@page { margin: 0.5cm; size: landscape; }"
);

fs.writeFileSync("index.html", content);
console.log("Added landscape size to @page in printWorkerReceipts");

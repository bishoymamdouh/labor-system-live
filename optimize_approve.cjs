const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /const allWorkers = await db\.getAll\('workers'\);\s*const workers = allWorkers\.filter\(w => String\(w\.recordId\) === String\(recordId\) && !w\.isDeleted\);/,
    "const workers = window.currentModalWorkers || [];"
);

fs.writeFileSync("index.html", content);
console.log("Replaced db.getAll with window.currentModalWorkers");

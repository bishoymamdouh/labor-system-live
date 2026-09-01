const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldCode = `const allWorkers = await db.getAll('workers');
                const workers = allWorkers.filter(w => String(w.recordId) === String(recordId) && !w.isDeleted);`;

content = content.replace(oldCode, "const workers = window.currentModalWorkers || [];");
fs.writeFileSync("index.html", content);
console.log("Successfully replaced db.getAll");

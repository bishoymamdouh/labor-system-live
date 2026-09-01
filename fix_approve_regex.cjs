const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /const workersRes = await fetch[\s\S]*?const workers = currentRec \? currentRec\.workers : \[\];/g,
    `const allWorkers = await db.getAll('workers');
                const workers = allWorkers.filter(w => String(w.recordId) === String(recordId) && !w.isDeleted);`
);

fs.writeFileSync("index.html", content);
console.log("Fixed updateRecordStatus using regex");

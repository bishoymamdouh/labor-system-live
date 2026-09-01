const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /UI\.renderEngineerRecords\(records, role\);/,
    "UI.renderEngineerRecords(records, role);\n        this.highlightRecordFromURL();"
);

content = content.replace(
    /UI\.renderSupervisorRecords\(records\);/,
    "UI.renderSupervisorRecords(records);\n        this.highlightRecordFromURL();"
);

fs.writeFileSync("index.html", content);
console.log("Fixed deep link scroll injection");

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '<input type="number" id="worker-amount-${workerId}" required min="0" ${auth.getRole() === "admin" || auth.getRole() === "engineer" ? "" : "readonly"} placeholder="اليومية">',
    '<input type="number" id="worker-amount-${workerId}" required min="0" ${auth.getRole() === "admin" || auth.getRole() === "engineer" ? "" : "readonly"} placeholder="اليومية" oninput="app.updateTotals()">'
);

fs.writeFileSync("index.html", content);
console.log("Added oninput event to update totals.");

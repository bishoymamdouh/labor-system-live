const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<input type="number" id="worker-amount-\$\{workerId\}" required min="0" readonly placeholder="اليومية">/g,
    '<input type="number" id="worker-amount-${workerId}" required min="0" ${auth.getRole() === "admin" || auth.getRole() === "engineer" ? "" : "readonly"} placeholder="اليومية">'
);

fs.writeFileSync("index.html", content);
console.log("Made worker amount editable for admin and engineer.");

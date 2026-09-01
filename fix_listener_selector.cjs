const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /const target = document\.getElementById\('record-card-' \+ viewRecordId\);/,
    "const activeView = document.querySelector('.view:not(.hidden)'); const target = activeView ? activeView.querySelector('#record-card-' + viewRecordId) : document.getElementById('record-card-' + viewRecordId);"
);

fs.writeFileSync("index.html", content);
console.log("Fixed element selector in listener");

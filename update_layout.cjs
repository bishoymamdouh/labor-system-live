const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">',
    '<div style="display: flex; flex-direction: column; gap: 30px; padding: 20px;">'
);

fs.writeFileSync("index.html", content);
console.log("Updated layout to flex column");

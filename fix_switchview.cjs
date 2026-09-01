const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(/UI\.switchView/g, "UI.showView");

fs.writeFileSync("index.html", content);
console.log("Fixed function name");

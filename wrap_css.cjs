const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    ".btn-group-align {\n    display: flex;\n    gap: 10px;\n}",
    ".btn-group-align {\n    display: flex;\n    gap: 10px;\n    flex-wrap: wrap;\n}"
);

fs.writeFileSync("index.html", content);
console.log("Added flex-wrap");

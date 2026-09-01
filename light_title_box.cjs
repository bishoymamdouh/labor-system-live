const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /background-color: #0056b3;/,
    "background-color: #eef5fb;"
);
content = content.replace(
    /color: #ffffff;/,
    "color: #003366;"
);
content = content.replace(
    /border: 1px solid #004494;/,
    "border: 1px solid #b8d4f0;"
);

fs.writeFileSync("index.html", content);
console.log("Updated title box to be light colored");

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldContent = content;
content = content.replace(
    /const role = auth\.getRole\(\);\s*document\.getElementById\('current-username'\)\.innerText/,
    "// removed duplicate const role\n        document.getElementById('current-username').innerText"
);

if (content !== oldContent) {
    fs.writeFileSync("index.html", content);
    console.log("Replaced successfully!");
} else {
    console.log("Still not replaced!");
}

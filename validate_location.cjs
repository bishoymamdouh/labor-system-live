const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /if \(name && amount >= 0\) {/,
    `if (name && amount >= 0) {
                if (!location.trim()) {
                    alert(\`الرجاء إدخال مكان العمل للعامل: \${name}\`);
                    return;
                }`
);

fs.writeFileSync("index.html", content);
console.log("Added custom validation for location field");

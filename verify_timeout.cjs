const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /setTimeout\(\(\) => \{[\s\n]*const activeView = /m,
    `setTimeout(() => {
                const activeView = `
);

content = content.replace(/1000\);[\s\n]*setTimeout\(\(\) => \{[\s\n]*target\.style\.boxShadow = "var\(--shadow\)";/, `1000);
                    setTimeout(() => {
                        target.style.boxShadow = "var(--shadow)";`);

fs.writeFileSync("index.html", content);
console.log("Verified timeout syntax");

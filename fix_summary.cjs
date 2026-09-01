const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// Try replacing using a more robust regex
let replaced = content.replace(
    /<div class="summary-item">\s*<span>.*?<\/span>\s*<strong id="total-amount">/g,
    '<div class="summary-item" id="summary-total-amount">\n                                <span>إجمالي السركي:</span>\n                                <strong id="total-amount">'
);

if (replaced !== content) {
    fs.writeFileSync("index.html", replaced);
    console.log("Success! Replaced HTML.");
} else {
    console.log("Not found or already replaced.");
}

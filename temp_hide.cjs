const fs = require("fs");
try {
    let content = fs.readFileSync("index.html", "utf8");
    content = content.replace('<span class="date-badge" id="current-date-badge"></span>', '<span class="date-badge" id="current-date-badge" style="display: none;"></span>');
    fs.writeFileSync("index.html", content);
    console.log("Success");
} catch(e) {
    console.log("Error: " + e.message);
}

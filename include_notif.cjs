const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

if (!content.includes('notifications.js')) {
    content = content.replace('</body>', '    <script src="notifications.js"></script>\n</body>');
    fs.writeFileSync("index.html", content);
    console.log("Included notifications.js");
}

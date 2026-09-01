const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace('<div id="view-notifications" class="view-section" style="display: none;">', '<section id="view-notifications" class="view hidden">');
content = content.replace('</div>\n\n        <!-- Add/Edit Scheduled Modal -->', '</section>\n\n        <!-- Add/Edit Scheduled Modal -->');

fs.writeFileSync("index.html", content);
console.log("Fixed View tag!");

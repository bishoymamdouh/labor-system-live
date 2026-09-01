const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const start = content.indexOf('<section id="view-admin"');
const end = content.indexOf('</section>', start) + 10;
fs.writeFileSync("admin_view_current.html", content.substring(start, end));

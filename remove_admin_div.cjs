const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');

const viewAdminStart = lines.findIndex(l => l.includes('<section id="view-admin"'));
const viewAdminEnd = lines.findIndex((l, i) => i > viewAdminStart && l.includes('</section>'));

// The extra div is right before viewAdminEnd. Let's check lines[viewAdminEnd - 1]
if (lines[viewAdminEnd - 1].trim() === '</div>') {
    lines.splice(viewAdminEnd - 1, 1);
    fs.writeFileSync("index.html", lines.join('\n'));
    console.log("Removed extra closing div from view-admin!");
} else {
    console.log("Line before section end is not exactly </div>, it is: " + lines[viewAdminEnd - 1]);
}

const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');

const viewAdminStart = lines.findIndex(l => l.includes('<section id="view-admin"'));
const viewAdminEnd = lines.findIndex((l, i) => i > viewAdminStart && l.includes('</section>'));

let open = 0;
let close = 0;
for(let i=viewAdminStart; i<=viewAdminEnd; i++) {
    open += (lines[i].match(/<div(\s|>)/g) || []).length;
    close += (lines[i].match(/<\/div>/g) || []).length;
}
console.log(`view-admin - Open: ${open}, Close: ${close}`);

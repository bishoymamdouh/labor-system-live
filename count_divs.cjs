const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');

let open = 0;
let close = 0;
for(let i=0; i<lines.length; i++) {
    open += (lines[i].match(/<div(\s|>)/g) || []).length;
    close += (lines[i].match(/<\/div>/g) || []).length;
}
console.log(`div tags - Open: ${open}, Close: ${close}`);

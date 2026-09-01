const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');

let open = 0;
let close = 0;
for(let i=0; i<lines.length; i++) {
    const o = (lines[i].match(/<div(\s|>)/g) || []).length;
    const c = (lines[i].match(/<\/div>/g) || []).length;
    open += o;
    close += c;
    if (c > 0 && close > open) {
        console.log(`Mismatch triggered at line ${i+1}: Open ${open}, Close ${close}`);
        console.log(lines[i]);
    }
}

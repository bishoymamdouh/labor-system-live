const fs = require("fs");
const lines = fs.readFileSync("index.html", "utf8").split('\n');

let stack = [];
for(let i=0; i<lines.length; i++) {
    const l = lines[i];
    const opens = (l.match(/<section/g) || []).length;
    const closes = (l.match(/<\/section>/g) || []).length;
    for(let j=0; j<opens; j++) stack.push(`section at ${i+1}`);
    for(let j=0; j<closes; j++) {
        if (stack.length > 0) stack.pop();
        else console.log(`Unmatched </section> at line ${i+1}`);
    }
}
console.log("Remaining unclosed sections:", stack);

let mainOpen = 0;
let mainClose = 0;
for(let i=0; i<lines.length; i++) {
    mainOpen += (lines[i].match(/<main/g) || []).length;
    mainClose += (lines[i].match(/<\/main>/g) || []).length;
}
console.log(`main tags - Open: ${mainOpen}, Close: ${mainClose}`);


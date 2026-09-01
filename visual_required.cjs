const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const lines = content.split('\n');
for (let i = 980; i < 995; i++) {
    if (lines[i].includes('<th>مكان العمل</th>')) {
        lines[i] = lines[i].replace('<th>مكان العمل</th>', '<th>مكان العمل <span style="color: red;">*</span></th>');
    }
}
fs.writeFileSync("index.html", lines.join('\n'));
console.log("Added visual asterisk");

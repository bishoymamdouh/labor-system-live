const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

const start = lines.findIndex(l => l.includes('<hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">'));
let end = -1;

if (start !== -1) {
    for (let i = start; i < start + 30; i++) {
        if (lines[i].includes('</section>')) {
            end = i - 2; // Before the closing divs
            break;
        }
    }
}

if (start !== -1 && end !== -1) {
    lines.splice(start, end - start + 1);
    fs.writeFileSync("index.html", lines.join('\n'));
    console.log("Removed system reminder section successfully!");
} else {
    console.log("Could not find section bounds.");
}

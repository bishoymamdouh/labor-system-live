const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

// Find the last </body> tag
let inserted = false;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('</body>')) {
        lines.splice(i, 0, '    <script src="notifications.js"></script>');
        inserted = true;
        break;
    }
}

if (inserted) {
    fs.writeFileSync("index.html", lines.join('\n'));
    console.log("Successfully appended the script tag.");
} else {
    console.log("Could not find </body> tag.");
}

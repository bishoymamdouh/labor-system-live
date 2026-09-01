const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split('\n');

// The problematic lines are 4143 to 4145
// 4143:         printHtml += '    <script src="notifications.js"></script>
// 4144: </body>
// 4145: </html>';

if (lines[4142].includes("printHtml +=")) {
    lines[4142] = "        printHtml += '</body></html>';";
    lines.splice(4143, 2); // Remove lines 4144 and 4145
}

fs.writeFileSync("index.html", lines.join('\n'));
console.log("Fixed the string literal manually");

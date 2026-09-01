const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// 1. Fix the broken string literal
const brokenString = `'    <script src="notifications.js"></script>\n</body></html>';`;
const fixedString = `'</body></html>';`;
content = content.replace(brokenString, fixedString);

// 2. Add the script before the final HTML </body> tag
const finalBodyTagRegex = /<\/body>\s*<\/html>/i;
content = content.replace(finalBodyTagRegex, '    <script src="notifications.js"></script>\n</body>\n</html>');

fs.writeFileSync("index.html", content);
console.log("Fixed the syntax error and properly injected notifications.js");

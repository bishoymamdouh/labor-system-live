const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /\.header \{ text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; \}\s*\.header h1 \{ margin: 0; font-size: 20px; \}\s*\.header p \{ margin: 3px 0 0; font-size: 14px; \}/,
    `.header { position: relative; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .header h1 { margin: 8px 0; font-size: 24px; font-weight: bold; }
                .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
                .header p { margin: 0; font-size: 14px; }
                .logo-img { position: absolute; right: 0; top: 0; max-height: 60px; }`
);

content = content.replace(
    /th, td \{ border: 1px solid #000; padding: 4px; text-align: center; \}/,
    `th, td { border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; word-wrap: break-word; }`
);

content = content.replace(
    /<div class="header">\s*<h1>سركي العامل<\/h1>\s*<p>\$\{dateRange\}<\/p>\s*<\/div>/,
    `<div class="header">
                    <img src="/logo.png?v=2" class="logo-img" alt="Logo">
                    <h2>Cornerstone Development - Project: The Curve</h2>
                    <h1>سركي العامل</h1>
                    <p>\${dateRange}</p>
                </div>`
);

fs.writeFileSync("index.html", content);
console.log("Updated print header with logo and table layout");

const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /<h2>Cornerstone Development - Project: The Curve<\/h2>/,
    `<div class="project-title-box">Cornerstone Development - Project: The Curve</div>`
);

content = content.replace(
    /\.header h2 \{ margin: 0; font-size: 16px; font-weight: bold; \}/,
    `.header h2 { margin: 0; font-size: 16px; font-weight: bold; }
                .project-title-box {
                    background-color: #0056b3;
                    color: #ffffff;
                    padding: 8px 20px;
                    border-radius: 6px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0;
                    border: 1px solid #004494;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }`
);

fs.writeFileSync("index.html", content);
console.log("Styled project title header");

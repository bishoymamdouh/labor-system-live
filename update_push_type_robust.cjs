const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /workerStats\[name\]\.records\.push\(\{([\s\S]*?)\}\);/g,
    function(match, p1) {
        if (!p1.includes("type: type")) {
            return `workerStats[name].records.push({
                type: type,${p1}});`;
        }
        return match;
    }
);

fs.writeFileSync("index.html", content);
console.log("Injected type robustly");

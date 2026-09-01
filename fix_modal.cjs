const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace('<div id="modal-scheduled" class="modal">', '<div id="modal-scheduled" class="modal" style="display: none;">');

fs.writeFileSync("index.html", content);
console.log("Fixed modal visibility!");

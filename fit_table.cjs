const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    '</style>',
    `
    /* Custom fit for reports table */
    #reports-table-full { font-size: 0.85em !important; }
    #reports-table-full th, #reports-table-full td { padding: 4px 6px !important; }
    #reports-table-full td:nth-child(9), #reports-table-full td:nth-child(10) { 
        max-width: 150px; 
        white-space: normal; 
        word-wrap: break-word; 
    }
    #reports-table-full td:nth-child(4) { white-space: nowrap; }
</style>`
);

fs.writeFileSync("index.html", content);
console.log("Added CSS for table fit");

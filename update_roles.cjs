const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    /const allowedRoles = \["admin", "warehouse_manager", "surveyor", "operator_supervisor"\];/,
    'const allowedRoles = ["supervisor", "warehouse_manager", "surveyor", "operator_supervisor"];'
);

fs.writeFileSync("server.ts", content);
console.log("Updated allowed roles for 10 AM reminder");

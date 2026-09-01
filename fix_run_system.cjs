const fs = require("fs");
let content = fs.readFileSync("RUN_SYSTEM.bat", "utf8");
content = content.replace("start_tunnel_cf.bat", "start_tunnel.bat");
fs.writeFileSync("RUN_SYSTEM.bat", content);
console.log("Fixed RUN_SYSTEM.bat");

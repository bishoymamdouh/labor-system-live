const fs = require('fs');
let code = fs.readFileSync('tunnel.ts', 'utf8');
code = code.replace(/'labor-system-live'/g, "'labor-app-live-2026'");
fs.writeFileSync('tunnel.ts', code);
console.log("Updated subdomain");

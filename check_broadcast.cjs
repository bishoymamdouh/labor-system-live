const fs = require('fs');
const ts = fs.readFileSync('server.ts', 'utf8');
const match = ts.match(/if \(url\.pathname === "\/api\/broadcast"[\s\S]*?try \{[\s\S]*?for await \(const subEntry/);
if (match) console.log(match[0]);

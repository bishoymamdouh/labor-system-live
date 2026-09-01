const fs = require('fs');
const ts = fs.readFileSync('server.ts', 'utf8');
const match = ts.match(/} else if \((req\.method === 'PUT' \|\| req\.method === 'POST') && url\.pathname === '\/api\/records'\) \{[\s\S]*?kv\.set/);
if (match) console.log(match[0]);

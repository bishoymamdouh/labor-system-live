const fs = require('fs');
const js = fs.readFileSync('script3.js', 'utf8');
console.log(js.substring(0, 100));
